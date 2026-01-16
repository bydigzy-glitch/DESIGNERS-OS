
import React, { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Sparkles,
    Target,
    FileText,
    Calendar,
    ChevronRight,
    ChevronLeft,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Zap,
    Users,
    Building2,
    Rocket,
    Shield,
    Copy,
    Download,
    RefreshCw,
    ArrowRight,
    Hash,
    Clock,
    BarChart3,
    Lightbulb,
    PenTool,
    MessageSquare,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { sendMessageToGeminiProxy } from '../services/geminiProxy';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Types
type CIEStep = 'SETUP' | 'TRENDS' | 'OPPORTUNITIES' | 'SCRIPTS' | 'PLAN';
type TrendStatus = 'RISING' | 'STABLE' | 'EMERGING' | 'DECLINING';
type FunnelStage = 'TOP' | 'MID' | 'BOTTOM';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type ContentType = 'TREND' | 'EVERGREEN' | 'AUTHORITY';
type ContentIntent = 'GROW' | 'ENGAGE' | 'CONVERT' | 'RETAIN';

interface CIEConfig {
    niche: string;
    audience: string;
    platforms: string[];
    maturity: 'EARLY' | 'SCALING' | 'ESTABLISHED';
    goal: 'GROWTH' | 'AUTHORITY' | 'CONVERSION' | 'RETENTION';
    offer?: string;
    competitors?: string;
    tone: 'DIRECT' | 'EDUCATIONAL' | 'CONFRONTATIONAL' | 'MINIMAL';
    timeHorizon: 7 | 14 | 30;
}

interface TrendData {
    name: string;
    status: TrendStatus;
    why: string;
    benefits: string;
    saturation: 'LOW' | 'MEDIUM' | 'HIGH';
    relevanceScore: number;
}

interface OpportunityData {
    id: string;
    trend: string;
    angle: string;
    format: string;
    funnelStage: FunnelStage;
    riskLevel: RiskLevel;
    competitorGap: string;
    platformNotes: string;
}

interface ScriptData {
    hook: string;
    framing: string;
    coreInsight: string;
    authoritySignal: string;
    cta: string;
    hookScore: {
        score: number;
        justification: string;
        improvements: string[];
    };
}

interface ContentPlanItem {
    day: number;
    title: string;
    format: string;
    intent: ContentIntent;
    contentType: ContentType;
    platform: string;
}

interface ContentPlanData {
    plan: ContentPlanItem[];
    mixBreakdown: {
        trend: number;
        evergreen: number;
        authority: number;
    };
}

// Token costs
const TOKEN_COSTS = {
    TRENDS: 0.50,
    OPPORTUNITIES: 0.30,
    SCRIPTS: 0.25,
    PLAN: 0.40
};

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'X', 'LinkedIn'];

interface ContentIntelligenceEngineProps {
    userTokens?: number;
    onUseToken?: (amount: number) => void;
    onAddTask?: (task: { title: string; category: string; date: Date }) => void;
}

export const ContentIntelligenceEngine: React.FC<ContentIntelligenceEngineProps> = ({
    userTokens = 100,
    onUseToken,
    onAddTask
}) => {
    // State
    const [step, setStep] = useState<CIEStep>('SETUP');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Config state
    const [config, setConfig] = useState<CIEConfig>({
        niche: '',
        audience: '',
        platforms: [],
        maturity: 'SCALING',
        goal: 'GROWTH',
        offer: '',
        competitors: '',
        tone: 'DIRECT',
        timeHorizon: 14
    });

    // Data state
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
    const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityData | null>(null);
    const [script, setScript] = useState<ScriptData | null>(null);
    const [contentPlan, setContentPlan] = useState<ContentPlanData | null>(null);
    const [scriptDuration, setScriptDuration] = useState<30 | 60>(30);

    const [showOptional, setShowOptional] = useState(false);

    // Validation
    const isSetupValid = config.niche.trim() && config.audience.trim() && config.platforms.length > 0;

    // Platform toggle
    const togglePlatform = (platform: string) => {
        setConfig(prev => ({
            ...prev,
            platforms: prev.platforms.includes(platform)
                ? prev.platforms.filter(p => p !== platform)
                : [...prev.platforms, platform]
        }));
    };

    // AI Calls
    const analyzeTrends = async () => {
        if (!isSetupValid) return;
        if (userTokens < TOKEN_COSTS.TRENDS) {
            alert('Insufficient tokens for trend analysis.');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Scanning market signals...');
        onUseToken?.(TOKEN_COSTS.TRENDS);

        try {
            const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            const prompt = `You are a trend intelligence analyst with deep expertise in ${config.niche}.

Today is ${currentDate}. Analyze REAL-TIME, CURRENT trends happening RIGHT NOW in ${config.niche} on ${config.platforms.join(', ')}.
Targeting: ${config.audience}
Brand maturity: ${config.maturity}
Goal: ${config.goal}
${config.offer ? `Offer/Product: ${config.offer}` : ''}
${config.competitors ? `Competitors: ${config.competitors}` : ''}

CRITICAL: Focus on ACTUAL trending topics from the past 7-14 days. For ${config.niche}, include specific examples like:
- If streetwear: mention actual trending items (e.g., deform cortez, specific sneaker drops, viral styling trends)
- If tech/SaaS: mention current platform updates, AI tools, features going viral
- Include format trends (speed recordings, POV content, screen recordings, etc.)

Return ONLY valid JSON (no markdown, no explanation):
{
  "trends": [
    {
      "name": "specific trend with real examples",
      "status": "RISING|STABLE|EMERGING|DECLINING",
      "why": "why this is trending RIGHT NOW (include dates/events if relevant)",
      "benefits": "CREATOR|BRAND|CONSUMER|ALL",
      "saturation": "LOW|MEDIUM|HIGH",
      "relevanceScore": 75
    }
  ]
}

Rules:
- Return 5-7 CURRENT micro-trends (not evergreen advice)
- Use REAL examples from the niche
- Mention specific format trends (speed edits, screen recordings, povs)
- Explain what's driving the trend RIGHT NOW
- relevanceScore is 0-100`;

            const response = await sendMessageToGeminiProxy(prompt, undefined, 'Content trend analysis');

            // Parse JSON from response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                setTrends(data.trends || []);
                setStep('TRENDS');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Trend analysis error:', error);
            // Fallback demo data
            // Enhanced fallback with niche-specific examples
            const nicheExamples = config.niche.toLowerCase().includes('street') ? [
                { name: 'Speed screen recordings of fit rotations', status: 'RISING' as TrendStatus, why: 'TikTok algorithm favoring quick-cut content showing multiple outfits. Deform Cortez revival driving nostalgic styling', benefits: 'BRAND', saturation: 'LOW' as const, relevanceScore: 94 },
                { name: 'Vintage grail unboxing with price reveals', status: 'EMERGING' as TrendStatus, why: 'Market transparency trend + collector culture going mainstream on Reels', benefits: 'ALL', saturation: 'LOW' as const, relevanceScore: 91 },
                { name: 'Styling challenge: one piece, 3 ways', status: 'RISING' as TrendStatus, why: 'Budget-conscious Gen-Z demanding versatility content', benefits: 'BRAND', saturation: 'MEDIUM' as const, relevanceScore: 87 },
                { name: 'Archive deep dives (2000s-2010s)', status: 'STABLE' as TrendStatus, why: 'Y2K nostalgia cycle reaching peak engagement', benefits: 'CREATOR', saturation: 'MEDIUM' as const, relevanceScore: 83 },
                { name: 'Generic OOTD with music', status: 'DECLINING' as TrendStatus, why: 'Oversaturated format, low retention rates', benefits: 'CREATOR', saturation: 'HIGH' as const, relevanceScore: 38 }
            ] : [
                { name: 'Behind-the-scenes process content', status: 'RISING' as TrendStatus, why: 'Authenticity fatigue driving demand for raw, unpolished content', benefits: 'BRAND', saturation: 'LOW' as const, relevanceScore: 92 },
                { name: 'Micro-documentary storytelling', status: 'EMERGING' as TrendStatus, why: 'Short-form video platforms favoring narrative arcs', benefits: 'ALL', saturation: 'LOW' as const, relevanceScore: 88 },
                { name: 'Problem-agitation hooks', status: 'STABLE' as TrendStatus, why: 'High-converting format for awareness content', benefits: 'BRAND', saturation: 'MEDIUM' as const, relevanceScore: 85 },
                { name: 'User-generated social proof', status: 'RISING' as TrendStatus, why: 'Trust economy shifting toward peer validation', benefits: 'BRAND', saturation: 'MEDIUM' as const, relevanceScore: 82 },
                { name: 'Day-in-the-life format', status: 'DECLINING' as TrendStatus, why: 'Market oversaturation, diminishing novelty', benefits: 'CREATOR', saturation: 'HIGH' as const, relevanceScore: 45 }
            ];
            setTrends(nicheExamples);
            setStep('TRENDS');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const generateOpportunities = async () => {
        if (trends.length === 0) return;
        if (userTokens < TOKEN_COSTS.OPPORTUNITIES) {
            alert('Insufficient tokens for opportunity mapping.');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Mapping content opportunities...');
        onUseToken?.(TOKEN_COSTS.OPPORTUNITIES);

        try {
            const prompt = `Based on these trends: ${JSON.stringify(trends.slice(0, 5))}
For niche: ${config.niche}
Platform: ${config.platforms.join(', ')}
Audience: ${config.audience}

Return ONLY valid JSON (no markdown):
{
  "opportunities": [
    {
      "trend": "trend name",
      "angle": "specific angle NOT a topic",
      "format": "platform-specific format",
      "funnelStage": "TOP|MID|BOTTOM",
      "riskLevel": "LOW|MEDIUM|HIGH",
      "competitorGap": "what competitors are missing",
      "platformNotes": "platform-specific advice"
    }
  ]
}

Rules:
- Suggest ANGLES, not topics
- Each must tie to funnel stage
- Identify what competitors are missing
- Return 5-8 opportunities`;

            const response = await sendMessageToGeminiProxy(prompt, undefined, 'Content opportunity mapping');

            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                const opps = (data.opportunities || []).map((o: any, i: number) => ({
                    ...o,
                    id: `opp-${i}`
                }));
                setOpportunities(opps);
                setStep('OPPORTUNITIES');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Opportunity mapping error:', error);
            // Demo fallback
            setOpportunities([
                { id: 'opp-1', trend: 'Behind-the-scenes process content', angle: 'Show the ugly first draft vs final result', format: 'Carousel/Reel', funnelStage: 'TOP', riskLevel: 'LOW', competitorGap: 'Most show polished outcomes only', platformNotes: 'Best for Instagram, strong save rates' },
                { id: 'opp-2', trend: 'Problem-agitation hooks', angle: 'Call out the industry lie your audience believes', format: 'Short-form video', funnelStage: 'MID', riskLevel: 'MEDIUM', competitorGap: 'Few address objections directly', platformNotes: 'Works across all platforms' },
                { id: 'opp-3', trend: 'Micro-documentary storytelling', angle: 'Client transformation story in 60 seconds', format: 'Reel/TikTok', funnelStage: 'BOTTOM', riskLevel: 'LOW', competitorGap: 'Case studies are text-heavy, boring', platformNotes: 'High conversion potential' }
            ]);
            setStep('OPPORTUNITIES');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const generateScript = async (opportunity: OpportunityData) => {
        if (userTokens < TOKEN_COSTS.SCRIPTS) {
            alert('Insufficient tokens for script generation.');
            return;
        }

        setSelectedOpportunity(opportunity);
        setIsLoading(true);
        setLoadingMessage('Crafting your script...');
        onUseToken?.(TOKEN_COSTS.SCRIPTS);

        try {
            const prompt = `You are a viral content strategist. Write a ${scriptDuration}-SECOND ${config.platforms[0]} script optimized for MAXIMUM VIRALITY.

Angle: ${opportunity.angle}
Trend: ${opportunity.trend}
Format: ${opportunity.format}
Tone: ${config.tone} (MAINTAIN NATURAL VOICE, avoid corporate speak)
Goal: ${config.goal}
Audience: ${config.audience}
Funnel Stage: ${opportunity.funnelStage}
Duration: ${scriptDuration} seconds

VIRAL OPTIMIZATION REQUIREMENTS:
1. HOOK (0-3 seconds): Pattern interrupt. No context. Extreme claim or visual contrast.
2. PACING: ${scriptDuration === 30 ? '3-5 second chunks. One idea per chunk. Fast cuts implied.' : '5-7 second chunks. Build tension. 2-3 main points.'}
3. RETENTION: Loop back to hook at end. Create open loop if possible.
4. NATURAL TONE: Write like the person talks, not like a script. Use contractions, fragments.

Return ONLY valid JSON:
{
  "hook": "EXACT first line (3 seconds max). Visual + verbal punch.",
  "framing": "Context in 1 sentence. Why NOW matters.",
  "coreInsight": "${scriptDuration === 30 ? '1 main point, delivered fast' : '2-3 points with pacing breaks'}",
  "authoritySignal": "Specific proof (numbers, test results, receipts)",
  "cta": "Action that matches ${config.goal}. Natural, not salesy.",
  "hookScore": {
    "score": 85,
    "justification": "Viral potential analysis",
    "improvements": ["specific viral optimization tip 1", "tip 2"]
  },
  "pacing": "${scriptDuration === 30 ? 'Beat 1 (0-10s): Hook + framing. Beat 2 (10-20s): Core insight. Beat 3 (20-30s): Authority + CTA.' : 'Beat 1 (0-15s): Hook + framing. Beat 2 (15-40s): Core insight with breathing room. Beat 3 (40-60s): Authority + CTA + loop.'}"
}

Rules:
- Hook MUST be scroll-stopping (test: would YOU stop?)
- Pacing optimized for ${scriptDuration}s retention
- Natural voice ("you're" not "you are", fragments OK)
- hookScore factors: novelty, emotional trigger, pattern interrupt, platform fit`;

            const response = await sendMessageToGeminiProxy(prompt, undefined, 'Script generation');

            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                setScript(data);
                setStep('SCRIPTS');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Script generation error:', error);
            // Demo fallback
            setScript({
                hook: scriptDuration === 30 ? "POV: You just spent 4 hours on a reel that got 200 views." : "You've been taught to start with benefits. That's why your content fails.",
                framing: "Every guru tells you to lead with value. But the algorithm doesn't care about value—it cares about pattern interrupts. Here's what actually stops the scroll.",
                coreInsight: "The first 0.5 seconds decide everything. Not your message, not your offer—your visual velocity. I tested 200 hooks across 3 accounts. The ones that opened with movement outperformed static frames by 340%. Your audience isn't scrolling to learn. They're scrolling to feel.",
                authoritySignal: "After managing $2M+ in creator campaigns and analyzing 50,000+ content pieces, one pattern emerged: the hook isn't what you say, it's what you show.",
                cta: "Save this for your next content day. Follow for more scroll-stopping strategies.",
                hookScore: {
                    score: 87,
                    justification: "Strong pattern interrupt, challenges conventional wisdom, uses specific data. Minor improvement: could be more visually descriptive.",
                    improvements: ["Add a visual cue in the hook", "Include a specific timeframe claim"]
                }
            });
            setStep('SCRIPTS');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const generateContentPlan = async () => {
        if (opportunities.length === 0) return;
        if (userTokens < TOKEN_COSTS.PLAN) {
            alert('Insufficient tokens for content plan.');
            return;
        }

        setIsLoading(true);
        setLoadingMessage(`Building your ${config.timeHorizon}-day strategy...`);
        onUseToken?.(TOKEN_COSTS.PLAN);

        try {
            const prompt = `Generate a ${config.timeHorizon}-day content plan for:
Niche: ${config.niche}
Platform: ${config.platforms.join(', ')}
Goal: ${config.goal}
Opportunities: ${JSON.stringify(opportunities.slice(0, 5))}

Return ONLY valid JSON:
{
  "plan": [
    {
      "day": 1,
      "title": "specific post title",
      "format": "Reel|Carousel|Thread|Story|etc",
      "intent": "GROW|ENGAGE|CONVERT|RETAIN",
      "contentType": "TREND|EVERGREEN|AUTHORITY",
      "platform": "Instagram"
    }
  ],
  "mixBreakdown": {
    "trend": 40,
    "evergreen": 35,
    "authority": 25
  }
}

Rules:
- Balance trend-led (40%), evergreen (35%), authority (25%)
- Titles must be specific, not "educational video"
- Each post has clear intent
- Return ${config.timeHorizon} items (one per day)`;

            const response = await sendMessageToGeminiProxy(prompt, undefined, 'Content plan generation');

            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                setContentPlan(data);
                setStep('PLAN');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Content plan error:', error);
            // Demo fallback
            const demoPlan: ContentPlanItem[] = Array.from({ length: config.timeHorizon }, (_, i) => ({
                day: i + 1,
                title: [
                    'The "ugly draft" reveal that builds trust',
                    'Why [industry advice] is costing you clients',
                    'Client result breakdown: $0 to $10K',
                    '3 hooks that stopped 1M+ scrolls',
                    'The question I get asked most (honest answer)',
                    'Process deep-dive: How I structure projects',
                    'Myth-busting: What actually matters for growth'
                ][i % 7],
                format: ['Reel', 'Carousel', 'Story', 'Thread', 'Reel'][i % 5],
                intent: (['GROW', 'ENGAGE', 'CONVERT', 'RETAIN'] as ContentIntent[])[i % 4],
                contentType: (['TREND', 'EVERGREEN', 'AUTHORITY'] as ContentType[])[i % 3],
                platform: config.platforms[i % config.platforms.length]
            }));
            setContentPlan({
                plan: demoPlan,
                mixBreakdown: { trend: 40, evergreen: 35, authority: 25 }
            });
            setStep('PLAN');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    // Copy helper
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Render helpers
    const getStatusBadge = (status: TrendStatus) => {
        const styles = {
            RISING: 'bg-green-500/10 text-green-500 border-green-500/20',
            STABLE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            EMERGING: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            DECLINING: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
        };
        const icons = {
            RISING: <TrendingUp size={12} />,
            STABLE: <BarChart3 size={12} />,
            EMERGING: <Sparkles size={12} />,
            DECLINING: <TrendingDown size={12} />
        };
        return (
            <Badge variant="outline" className={`gap-1 ${styles[status]}`}>
                {icons[status]} {status}
            </Badge>
        );
    };

    const getRiskBadge = (risk: RiskLevel) => {
        const styles = {
            LOW: 'bg-green-500/10 text-green-500',
            MEDIUM: 'bg-orange-500/10 text-orange-500',
            HIGH: 'bg-red-500/10 text-red-500'
        };
        return <Badge className={styles[risk]}>{risk} RISK</Badge>;
    };

    const getFunnelBadge = (stage: FunnelStage) => {
        const labels = { TOP: 'Awareness', MID: 'Consideration', BOTTOM: 'Conversion' };
        return <Badge variant="outline">{labels[stage]}</Badge>;
    };

    // Step navigation
    const stepOrder: CIEStep[] = ['SETUP', 'TRENDS', 'OPPORTUNITIES', 'SCRIPTS', 'PLAN'];
    const currentStepIndex = stepOrder.indexOf(step);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                        <Target size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Content Intelligence Engine</h1>
                        <p className="text-sm text-muted-foreground">Strategic content planning backed by trend data</p>
                    </div>
                </div>

                {/* Progress indicator */}
                <div className="hidden md:flex items-center gap-2">
                    {stepOrder.map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < currentStepIndex ? 'bg-primary text-primary-foreground' :
                                i === currentStepIndex ? 'bg-primary/20 text-primary border-2 border-primary' :
                                    'bg-secondary text-muted-foreground'
                                }`}>
                                {i < currentStepIndex ? <CheckCircle2 size={16} /> : i + 1}
                            </div>
                            {i < stepOrder.length - 1 && (
                                <div className={`w-8 h-0.5 ${i < currentStepIndex ? 'bg-primary' : 'bg-secondary'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={48} className="animate-spin text-primary" />
                        <p className="text-lg font-medium text-foreground">{loadingMessage}</p>
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <FadeIn key={step}>
                    {/* SETUP STEP */}
                    {step === 'SETUP' && (
                        <div className="max-w-3xl mx-auto space-y-8">
                            <div className="text-center mb-8">
                                <h2 className="text-xl font-bold text-foreground mb-2">Configure Your Strategy</h2>
                                <p className="text-muted-foreground">Tell us about your brand to generate targeted insights</p>
                            </div>

                            {/* Required fields */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Shield size={16} className="text-primary" />
                                        Required Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="niche">Primary Niche</Label>
                                        <Input
                                            id="niche"
                                            placeholder="e.g., Streetwear brands, SaaS founders, Fitness coaches"
                                            value={config.niche}
                                            onChange={e => setConfig(prev => ({ ...prev, niche: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="audience">Target Audience</Label>
                                        <textarea
                                            id="audience"
                                            className="w-full min-h-[100px] bg-background border border-input rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                            placeholder="Describe your ideal customer: role, awareness level, pain points, goals..."
                                            value={config.audience}
                                            onChange={e => setConfig(prev => ({ ...prev, audience: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Platform Focus</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {PLATFORMS.map(platform => (
                                                <Button
                                                    key={platform}
                                                    variant={config.platforms.includes(platform) ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => togglePlatform(platform)}
                                                    className="gap-1"
                                                >
                                                    {platform}
                                                    {config.platforms.includes(platform) && <CheckCircle2 size={14} />}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Brand Maturity</Label>
                                            <Select
                                                value={config.maturity}
                                                onValueChange={(v: any) => setConfig(prev => ({ ...prev, maturity: v }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="EARLY">Early Stage</SelectItem>
                                                    <SelectItem value="SCALING">Scaling</SelectItem>
                                                    <SelectItem value="ESTABLISHED">Established</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Content Goal</Label>
                                            <Select
                                                value={config.goal}
                                                onValueChange={(v: any) => setConfig(prev => ({ ...prev, goal: v }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GROWTH">Growth</SelectItem>
                                                    <SelectItem value="AUTHORITY">Authority</SelectItem>
                                                    <SelectItem value="CONVERSION">Conversion</SelectItem>
                                                    <SelectItem value="RETENTION">Retention</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Optional fields */}
                            <Card className="border-dashed">
                                <CardHeader className="cursor-pointer" onClick={() => setShowOptional(!showOptional)}>
                                    <CardTitle className="text-base flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Lightbulb size={16} />
                                            Optional: Enhance Analysis
                                        </span>
                                        <ChevronRight size={16} className={`transition-transform ${showOptional ? 'rotate-90' : ''}`} />
                                    </CardTitle>
                                </CardHeader>
                                {showOptional && (
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Offer/Product</Label>
                                            <Input
                                                placeholder="Describe your product or service"
                                                value={config.offer}
                                                onChange={e => setConfig(prev => ({ ...prev, offer: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Competitors</Label>
                                            <Input
                                                placeholder="@handles or domains to analyze"
                                                value={config.competitors}
                                                onChange={e => setConfig(prev => ({ ...prev, competitors: e.target.value }))}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Brand Tone</Label>
                                                <Select
                                                    value={config.tone}
                                                    onValueChange={(v: any) => setConfig(prev => ({ ...prev, tone: v }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="DIRECT">Direct</SelectItem>
                                                        <SelectItem value="EDUCATIONAL">Educational</SelectItem>
                                                        <SelectItem value="CONFRONTATIONAL">Confrontational</SelectItem>
                                                        <SelectItem value="MINIMAL">Minimal</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Time Horizon</Label>
                                                <Select
                                                    value={String(config.timeHorizon)}
                                                    onValueChange={(v) => setConfig(prev => ({ ...prev, timeHorizon: Number(v) as 7 | 14 | 30 }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="7">7 Days</SelectItem>
                                                        <SelectItem value="14">14 Days</SelectItem>
                                                        <SelectItem value="30">30 Days</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            {/* Action */}
                            <div className="flex justify-center">
                                <Button
                                    size="lg"
                                    disabled={!isSetupValid || isLoading}
                                    onClick={analyzeTrends}
                                    className="gap-2 px-8"
                                >
                                    <Sparkles size={18} />
                                    Analyze Market Trends
                                    <span className="text-xs opacity-70">({TOKEN_COSTS.TRENDS} tokens)</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* TRENDS STEP */}
                    {step === 'TRENDS' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Niche Trend Breakdown</h2>
                                    <p className="text-sm text-muted-foreground">Rising signals in {config.niche}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={analyzeTrends} disabled={isLoading} className="gap-1">
                                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                                        Refresh Trends
                                    </Button>
                                    <Button variant="outline" onClick={() => setStep('SETUP')}>
                                        <ChevronLeft size={16} /> Back
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {trends.map((trend, i) => (
                                    <Card key={i} className={`hover:border-primary/50 transition-colors ${trend.status === 'DECLINING' ? 'opacity-60' : ''}`}>
                                        <CardContent className="p-5 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <h3 className="font-bold text-foreground leading-tight">{trend.name}</h3>
                                                {getStatusBadge(trend.status)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{trend.why}</p>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Saturation: {trend.saturation}</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-primary">{trend.relevanceScore}</span>
                                                    <span className="text-muted-foreground">/ 100</span>
                                                </div>
                                            </div>
                                            <Progress value={trend.relevanceScore} className="h-1" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="flex justify-center pt-4">
                                <Button size="lg" onClick={generateOpportunities} className="gap-2">
                                    Map Content Opportunities <ArrowRight size={16} />
                                    <span className="text-xs opacity-70">({TOKEN_COSTS.OPPORTUNITIES} tokens)</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* OPPORTUNITIES STEP */}
                    {step === 'OPPORTUNITIES' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Content Opportunities</h2>
                                    <p className="text-sm text-muted-foreground">Strategic angles your competitors are missing</p>
                                </div>
                                <Button variant="outline" onClick={() => setStep('TRENDS')}>
                                    <ChevronLeft size={16} /> Back
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {opportunities.map((opp) => (
                                    <Card key={opp.id} className="hover:border-primary/50 transition-colors">
                                        <CardContent className="p-5">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-foreground">{opp.angle}</h3>
                                                        {getFunnelBadge(opp.funnelStage)}
                                                        {getRiskBadge(opp.riskLevel)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        <span className="font-medium">Trend:</span> {opp.trend}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        <span className="font-medium">Gap:</span> {opp.competitorGap}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1"><FileText size={12} /> {opp.format}</span>
                                                        <span>{opp.platformNotes}</span>
                                                    </div>
                                                </div>
                                                <Button onClick={() => generateScript(opp)} className="gap-1 shrink-0">
                                                    <PenTool size={14} /> Generate Script
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="flex justify-center pt-4">
                                <Button size="lg" variant="outline" onClick={generateContentPlan} className="gap-2">
                                    <Calendar size={16} /> Generate {config.timeHorizon}-Day Plan
                                    <span className="text-xs opacity-70">({TOKEN_COSTS.PLAN} tokens)</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* SCRIPTS STEP */}
                    {step === 'SCRIPTS' && script && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Script Writer</h2>
                                    <p className="text-sm text-muted-foreground">
                                        For: {selectedOpportunity?.angle}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 mr-2">
                                        <Button
                                            variant={scriptDuration === 30 ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setScriptDuration(30)}
                                        >
                                            30s
                                        </Button>
                                        <Button
                                            variant={scriptDuration === 60 ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setScriptDuration(60)}
                                        >
                                            60s
                                        </Button>
                                    </div>
                                    <Button variant="outline" onClick={() => setStep('OPPORTUNITIES')}>
                                        <ChevronLeft size={16} /> Back
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Script output */}
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Hook - highlighted */}
                                    <Card className="border-2 border-primary/30 bg-primary/5">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2 text-primary">
                                                <Zap size={14} /> THE HOOK
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-lg font-bold text-foreground leading-relaxed">"{script.hook}"</p>
                                            <Button variant="ghost" size="sm" className="mt-2" onClick={() => copyToClipboard(script.hook)}>
                                                <Copy size={12} /> Copy
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Other sections */}
                                    {[
                                        { label: 'Framing', icon: <MessageSquare size={14} />, content: script.framing },
                                        { label: 'Core Insight', icon: <Lightbulb size={14} />, content: script.coreInsight },
                                        { label: 'Authority Signal', icon: <Shield size={14} />, content: script.authoritySignal },
                                        { label: 'Call to Action', icon: <Target size={14} />, content: script.cta }
                                    ].map(section => (
                                        <Card key={section.label}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                                                    {section.icon} {section.label}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-foreground leading-relaxed">{section.content}</p>
                                                <Button variant="ghost" size="sm" className="mt-2" onClick={() => copyToClipboard(section.content)}>
                                                    <Copy size={12} /> Copy
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Button variant="outline" className="w-full gap-2" onClick={() => selectedOpportunity && generateScript(selectedOpportunity)}>
                                        <RefreshCw size={14} /> Regenerate Script
                                    </Button>
                                </div>

                                {/* Hook Score */}
                                <div className="space-y-4">
                                    <Card className="sticky top-4">
                                        <CardHeader>
                                            <CardTitle className="text-sm">Hook Score</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-center">
                                                <div className="relative w-32 h-32">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary" />
                                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={352} strokeDashoffset={352 - (352 * script.hookScore.score) / 100} className="text-primary transition-all duration-1000" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-3xl font-bold text-foreground">{script.hookScore.score}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{script.hookScore.justification}</p>
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-muted-foreground uppercase">How to improve:</p>
                                                <ul className="space-y-1">
                                                    {script.hookScore.improvements.map((imp, i) => (
                                                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                                            <ArrowRight size={12} className="mt-1 text-primary shrink-0" />
                                                            {imp}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PLAN STEP */}
                    {step === 'PLAN' && contentPlan && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">{config.timeHorizon}-Day Content Plan</h2>
                                    <p className="text-sm text-muted-foreground">Strategic calendar for {config.niche}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={() => setStep('OPPORTUNITIES')}>
                                        <ChevronLeft size={16} /> Back
                                    </Button>
                                    <Button variant="outline" onClick={() => copyToClipboard(JSON.stringify(contentPlan.plan, null, 2))}>
                                        <Copy size={14} /> Export
                                    </Button>
                                </div>
                            </div>

                            {/* Mix breakdown */}
                            <Card>
                                <CardContent className="py-4">
                                    <div className="flex items-center gap-6">
                                        <span className="text-sm font-medium text-muted-foreground">Content Mix:</span>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                                <span className="text-sm">Trend-led ({contentPlan.mixBreakdown.trend}%)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                <span className="text-sm">Evergreen ({contentPlan.mixBreakdown.evergreen}%)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                                <span className="text-sm">Authority ({contentPlan.mixBreakdown.authority}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Plan grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {contentPlan.plan.map(item => {
                                    const typeColors = {
                                        TREND: 'border-l-purple-500',
                                        EVERGREEN: 'border-l-blue-500',
                                        AUTHORITY: 'border-l-green-500'
                                    };
                                    const intentIcons = {
                                        GROW: <TrendingUp size={12} />,
                                        ENGAGE: <MessageSquare size={12} />,
                                        CONVERT: <Target size={12} />,
                                        RETAIN: <Users size={12} />
                                    };

                                    return (
                                        <Card key={item.day} className={`border-l-4 ${typeColors[item.contentType]}`}>
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-muted-foreground">DAY {item.day}</span>
                                                    <Badge variant="outline" className="text-[10px]">{item.platform}</Badge>
                                                </div>
                                                <h4 className="font-bold text-foreground text-sm leading-tight">{item.title}</h4>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>{item.format}</span>
                                                    <span className="flex items-center gap-1">
                                                        {intentIcons[item.intent]} {item.intent}
                                                    </span>
                                                </div>
                                                {onAddTask && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full gap-1 text-xs"
                                                        onClick={() => {
                                                            const taskDate = new Date();
                                                            taskDate.setDate(taskDate.getDate() + item.day - 1);
                                                            onAddTask({
                                                                title: item.title,
                                                                category: 'CONTENT',
                                                                date: taskDate
                                                            });
                                                        }}
                                                    >
                                                        <Plus size={12} /> Quick Add to Tasks
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </FadeIn>
            </div>
        </div>
    );
};

export default ContentIntelligenceEngine;
