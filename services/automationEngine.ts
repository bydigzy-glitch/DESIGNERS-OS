
import {
    DesignersHubState,
    AutoActionLog,
    ApprovalRequest,
    RiskAlert,
    HandledAction,
    Project,
    Client,
    Task,
    AutopilotMode
} from '../types';

/**
 * The Automation Engine is the heart of Designers Hub.
 * it processes the current state and generates:
 * 1. Automatic Actions (Handled)
 * 2. Approval Requests (Needs user input)
 * 3. Risk Alerts (Critical updates)
 */
export class AutomationEngine {
    private state: DesignersHubState;
    private mode: AutopilotMode;

    constructor(state: DesignersHubState, mode: AutopilotMode = 'CONFIDENT') {
        this.state = state;
        this.mode = mode;
    }

    /**
     * Run the full diagnostic and return new actions/alerts
     */
    public async runDiagnostic(): Promise<{
        handled: HandledAction[];
        approvals: ApprovalRequest[];
        risks: RiskAlert[];
    }> {
        const handled: HandledAction[] = [];
        const approvals: ApprovalRequest[] = [];
        const risks: RiskAlert[] = [];

        // 1. Process Projects
        this.state.projects.forEach(project => {
            this.checkProjectHealth(project, handled, approvals, risks);
        });

        // 2. Process Clients
        this.state.clients.forEach(client => {
            this.checkClientHealth(client, handled, approvals, risks);
        });

        // 3. Process Schedule
        this.checkScheduleHealth(handled, approvals, risks);

        return { handled, approvals, risks };
    }

    private checkProjectHealth(
        project: Project,
        handled: HandledAction[],
        approvals: ApprovalRequest[],
        risks: RiskAlert[]
    ) {
        const today = new Date();

        // Rule: Overdue Invoice -> Pause Work or Alert
        if (project.invoiceStatus === 'OVERDUE') {
            if (this.mode === 'STRICT') {
                handled.push({
                    id: `auto-pause-${project.id}`,
                    timestamp: new Date(),
                    action: `Paused Project: ${project.title}`,
                    trigger: 'Invoice is overdue',
                    result: 'Work suspended until payment received.',
                    icon: 'Pause'
                });
            } else {
                risks.push({
                    id: `risk-overdue-${project.id}`,
                    timestamp: new Date(),
                    type: 'FINANCIAL',
                    severity: 'HIGH',
                    title: 'Unpaid Invoice Risk',
                    message: `${project.title} has an overdue invoice. Payment reliability score decreasing.`,
                    acknowledged: false
                });
            }
        }

        // Rule: Scope Creep Detection
        if ((project.revisionsUsed || 0) >= (project.revisionsAllowed || 3)) {
            approvals.push({
                id: `approve-extra-rev-${project.id}`,
                timestamp: new Date(),
                type: 'SCOPE',
                title: 'Extra Revision Requested',
                message: `Client for ${project.title} has reached the revision limit. Should I charge an overage fee?`,
                data: { projectId: project.id, fee: project.price ? project.price * 0.1 : 50 },
                urgency: 'MEDIUM'
            });
        }

        // Rule: Approaching Deadline
        if (project.deadline && project.status === 'ACTIVE' && project.progress < 80) {
            const daysLeft = Math.floor((new Date(project.deadline).getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
            if (daysLeft <= 2) {
                risks.push({
                    id: `risk-deadline-${project.id}`,
                    timestamp: new Date(),
                    type: 'DEADLINE',
                    severity: 'CRITICAL',
                    title: 'Deadline Crisis',
                    message: `${project.title} is due in ${daysLeft} days and is only ${project.progress}% complete.`,
                    acknowledged: false
                });
            }
        }
        // Rule: Money Intelligence - Undercharging detection
        if (project.price && project.price < 500 && project.status === 'ACTIVE') {
            risks.push({
                id: `risk-undercharge-${project.id}`,
                timestamp: new Date(),
                type: 'UNDERCHARGING',
                severity: 'INFO',
                title: 'Potential Undercharging',
                message: `${project.title} price is below typical market rate. Consider increasing value or rate.`,
                acknowledged: false
            });
        }
    }

    private checkClientHealth(
        client: Client,
        handled: HandledAction[],
        approvals: ApprovalRequest[],
        risks: RiskAlert[]
    ) {
        // Rule: Ghosting Detection
        const lastContact = client.communicationHistory?.lastContact;
        if (lastContact && client.status === 'ACTIVE') {
            const daysSince = Math.floor((new Date().getTime() - new Date(lastContact).getTime()) / (24 * 60 * 60 * 1000));
            if (daysSince > 7) {
                if (this.mode !== 'ASSIST') {
                    handled.push({
                        id: `auto-followup-${client.id}`,
                        timestamp: new Date(),
                        action: `Followed up with ${client.name}`,
                        trigger: `7 days since last contact`,
                        result: 'Sent a gentle nudge regarding pending project updates.',
                        icon: 'Mail'
                    });
                } else {
                    approvals.push({
                        id: `approve-followup-${client.id}`,
                        timestamp: new Date(),
                        type: 'COMMUNICATION',
                        title: 'Nudge Client?',
                        message: `It's been a week since you heard from ${client.name}. Want me to send a followup?`,
                        data: { clientId: client.id },
                        urgency: 'LOW'
                    });
                }
            }
        }
    }

    private checkScheduleHealth(
        handled: HandledAction[],
        approvals: ApprovalRequest[],
        risks: RiskAlert[]
    ) {
        // Rule: Burnout Protection - Weekly Hours
        const weekHours = this.calculateWeeklyHours();
        if (weekHours > 45) {
            risks.push({
                id: 'risk-burnout-hours',
                timestamp: new Date(),
                type: 'BURNOUT',
                severity: 'CRITICAL',
                title: 'Severe Burnout Risk',
                message: `You've clocked ${weekHours}h this week. System recommends immediate shutdown or rescheduling.`,
                acknowledged: false
            });
        }

        // Rule: Time Guardian - Back-to-back detection
        const tasksToday = this.state.tasks.filter(t =>
            !t.completed && new Date(t.date).toDateString() === new Date().toDateString()
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (let i = 0; i < tasksToday.length - 1; i++) {
            const current = tasksToday[i];
            const next = tasksToday[i + 1];
            const currentEnd = new Date(current.date).getTime() + (current.duration || 60) * 60 * 1000;
            const nextStart = new Date(next.date).getTime();

            if (nextStart - currentEnd < 5 * 60 * 1000) { // Less than 5 mins gap
                risks.push({
                    id: `risk-gap-${current.id}-${next.id}`,
                    timestamp: new Date(),
                    type: 'BURNOUT',
                    severity: 'WARNING',
                    title: 'No Breathing Room',
                    message: `Back-to-back tasks detected: "${current.title}" and "${next.title}". Adding buffer is recommended.`,
                    acknowledged: false
                });
            }
        }
    }

    private calculateWeeklyHours(): number {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        return this.state.tasks
            .filter(t => !t.completed && new Date(t.date) >= startOfWeek)
            .reduce((s, t) => s + (t.duration || 60), 0) / 60;
    }
}
