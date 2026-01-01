
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { IntakeSubmission, Client } from '../types';

interface IntakeFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (submission: IntakeSubmission) => Promise<void>;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
    isOpen,
    onClose,
    onSubmit
}) => {
    const [loading, setLoading] = useState(false);
    const [complete, setComplete] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        budget: '',
        timeline: '',
        description: '',
        source: 'referral'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const submission: IntakeSubmission = {
            id: Date.now().toString(),
            timestamp: new Date(),
            data: formData,
            status: 'PENDING'
        };

        try {
            await onSubmit(submission);
            setComplete(true);
            setTimeout(() => {
                onClose();
                setComplete(false);
                setFormData({ name: '', email: '', budget: '', timeline: '', description: '', source: 'referral' });
            }, 2000);
        } catch (error) {
            console.error('Intake failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
                {complete ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                            <CheckCircle2 size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Submission Received</h2>
                            <p className="text-muted-foreground">The Brain is now analyzing this project.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="text-primary" size={20} />
                                New Project Intake
                            </DialogTitle>
                            <DialogDescription>
                                Provide details for AI scoring and risk assessment.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget Range</Label>
                                    <Select
                                        value={formData.budget}
                                        onValueChange={v => setFormData({ ...formData, budget: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select budget" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Under $1k</SelectItem>
                                            <SelectItem value="med">$1k - $5k</SelectItem>
                                            <SelectItem value="high">$5k - $10k</SelectItem>
                                            <SelectItem value="enterprise">$10k+</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timeline">Timeline</Label>
                                    <Select
                                        value={formData.timeline}
                                        onValueChange={v => setFormData({ ...formData, timeline: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timeline" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="rush">ASAP (1-2 weeks)</SelectItem>
                                            <SelectItem value="normal">1 Month</SelectItem>
                                            <SelectItem value="relaxed">2+ Months</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Project Description</Label>
                                <Textarea
                                    id="description"
                                    className="min-h-[100px]"
                                    placeholder="Tell the Brain what you need..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading} className="gap-2">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    Submit to Brain
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
