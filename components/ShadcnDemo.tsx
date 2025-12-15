/**
 * SHADCN DEMO COMPONENT
 * 
 * This component demonstrates all the Shadcn/ui components we've installed.
 * Use this as a reference for migrating existing components.
 */

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { MoreHorizontal, Trash2, Edit, Plus, Star, Settings, User } from 'lucide-react';

export const ShadcnDemo: React.FC = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { toast } = useToast();

    const showToast = () => {
        toast({
            title: "Success!",
            description: "This is a Shadcn toast notification.",
        });
    };

    const showDestructiveToast = () => {
        toast({
            variant: "destructive",
            title: "Error!",
            description: "Something went wrong.",
        });
    };

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold">Shadcn/ui Demo</h1>
                <p className="text-muted-foreground">
                    All the components we've installed and how to use them
                </p>
            </div>

            {/* BUTTONS SECTION */}
            <Card>
                <CardHeader>
                    <CardTitle>Buttons</CardTitle>
                    <CardDescription>Different button variants and sizes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Variants */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Variants</h3>
                        <div className="flex flex-wrap gap-2">
                            <Button>Default</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="destructive">Destructive</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="link">Link</Button>
                        </div>
                    </div>

                    {/* Sizes */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Sizes</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button size="sm">Small</Button>
                            <Button size="default">Default</Button>
                            <Button size="lg">Large</Button>
                            <Button size="icon"><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>

                    {/* With Icons */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">With Icons</h3>
                        <div className="flex flex-wrap gap-2">
                            <Button><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
                            <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                            <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* CARDS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Simple Card</CardTitle>
                        <CardDescription>A basic card with header and content</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            This is the card content. You can put anything here.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Card with Footer</CardTitle>
                        <CardDescription>Includes action buttons</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Cards can have footers for actions.
                        </p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button variant="outline" size="sm">Cancel</Button>
                        <Button size="sm">Save</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>With Badge</CardTitle>
                            <Badge>New</Badge>
                        </div>
                        <CardDescription>Card with status badge</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Combine cards with other components.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* DIALOG SECTION */}
            <Card>
                <CardHeader>
                    <CardTitle>Dialog (Modal)</CardTitle>
                    <CardDescription>Accessible modal dialogs</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>Open Dialog</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Are you sure?</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This will permanently delete your account
                                    and remove your data from our servers.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => setDialogOpen(false)}>
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {/* DROPDOWN MENU SECTION */}
            <Card>
                <CardHeader>
                    <CardTitle>Dropdown Menu</CardTitle>
                    <CardDescription>Context menus and dropdowns</CardDescription>
                </CardHeader>
                <CardContent>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardContent>
            </Card>

            {/* TOAST SECTION */}
            <Card>
                <CardHeader>
                    <CardTitle>Toast Notifications</CardTitle>
                    <CardDescription>Non-intrusive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex gap-2">
                        <Button onClick={showToast}>Show Success Toast</Button>
                        <Button variant="destructive" onClick={showDestructiveToast}>
                            Show Error Toast
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* BADGES SECTION */}
            <Card>
                <CardHeader>
                    <CardTitle>Badges</CardTitle>
                    <CardDescription>Status indicators and labels</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Badge>Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                        <Badge variant="outline">Outline</Badge>
                        <Badge className="bg-green-500">Custom</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* AVATARS SECTION */}
            <Card>
                <CardHeader>
                    <CardTitle>Avatars</CardTitle>
                    <CardDescription>User profile pictures</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <Avatar>
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <Avatar>
                            <AvatarFallback className="bg-primary text-white">
                                <Star className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </CardContent>
            </Card>

            {/* CODE EXAMPLES */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage Examples</CardTitle>
                    <CardDescription>How to use these components in your code</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Button Example:</h3>
                        <pre className="bg-secondary p-4 rounded-lg text-xs overflow-x-auto">
                            {`import { Button } from "@/components/ui/button"

<Button>Click Me</Button>
<Button variant="destructive">Delete</Button>`}
                        </pre>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Card Example:</h3>
                        <pre className="bg-secondary p-4 rounded-lg text-xs overflow-x-auto">
                            {`import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>`}
                        </pre>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Toast Example:</h3>
                        <pre className="bg-secondary p-4 rounded-lg text-xs overflow-x-auto">
                            {`import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

toast({
  title: "Success!",
  description: "Your changes have been saved.",
})`}
                        </pre>
                    </div>
                </CardContent>
            </Card>

            {/* Toaster component - required for toasts to work */}
            <Toaster />
        </div>
    );
};
