"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { IconUser, IconBell, IconShield, IconPalette, IconLanguage, IconDownload, IconTrash } from "@tabler/icons-react"

export default function SettingsPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6">
                <div>
                  <h1 className="text-2xl font-bold">Settings</h1>
                  <p className="text-muted-foreground">Manage your account and preferences</p>
                </div>
              </div>

              {/* Settings Sections */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Profile Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconUser className="h-5 w-5" />
                        Profile Settings
                      </CardTitle>
                      <CardDescription>Update your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" defaultValue="john.doe@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" defaultValue="Acme Corporation" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" defaultValue="Product Manager" />
                      </div>
                      <Button className="w-full">Save Changes</Button>
                    </CardContent>
                  </Card>

                  {/* Notification Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconBell className="h-5 w-5" />
                        Notifications
                      </CardTitle>
                      <CardDescription>Configure your notification preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email Notifications</Label>
                        <Select defaultValue="all">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All notifications</SelectItem>
                            <SelectItem value="important">Important only</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Meeting Reminders</Label>
                        <Select defaultValue="15min">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5min">5 minutes before</SelectItem>
                            <SelectItem value="15min">15 minutes before</SelectItem>
                            <SelectItem value="30min">30 minutes before</SelectItem>
                            <SelectItem value="1hour">1 hour before</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Processing Updates</Label>
                        <Select defaultValue="completed">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All updates</SelectItem>
                            <SelectItem value="completed">When completed</SelectItem>
                            <SelectItem value="errors">Errors only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full">Update Preferences</Button>
                    </CardContent>
                  </Card>

                  {/* Privacy & Security */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconShield className="h-5 w-5" />
                        Privacy & Security
                      </CardTitle>
                      <CardDescription>Manage your privacy and security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Data Retention</Label>
                        <Select defaultValue="1year">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30days">30 days</SelectItem>
                            <SelectItem value="6months">6 months</SelectItem>
                            <SelectItem value="1year">1 year</SelectItem>
                            <SelectItem value="forever">Forever</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Meeting Access</Label>
                        <Select defaultValue="team">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="team">Team members</SelectItem>
                            <SelectItem value="organization">Organization</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Two-Factor Authentication</Label>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Enable 2FA for extra security</span>
                          <Button size="sm" variant="outline">Enable</Button>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-red-600">Danger Zone</Label>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full text-red-600 border-red-600 hover:bg-red-50">
                            <IconTrash className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Appearance & Language */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconPalette className="h-5 w-5" />
                        Appearance & Language
                      </CardTitle>
                      <CardDescription>Customize your experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select defaultValue="system">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select defaultValue="id">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id">Bahasa Indonesia</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Time Zone</Label>
                        <Select defaultValue="wib">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wib">WIB (UTC+7)</SelectItem>
                            <SelectItem value="wita">WITA (UTC+8)</SelectItem>
                            <SelectItem value="wit">WIT (UTC+9)</SelectItem>
                            <SelectItem value="utc">UTC (UTC+0)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date Format</Label>
                        <Select defaultValue="dd-mm-yyyy">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                            <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                            <SelectItem value="yyyy-mm-dd">YYYY/MM/DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full">Save Preferences</Button>
                    </CardContent>
                  </Card>

                  {/* Data Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconDownload className="h-5 w-5" />
                        Data Management
                      </CardTitle>
                      <CardDescription>Export and manage your data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Export Data</Label>
                        <p className="text-sm text-muted-foreground">Download all your meeting data and summaries</p>
                        <Button variant="outline" className="w-full">
                          <IconDownload className="h-4 w-4 mr-2" />
                          Export All Data
                        </Button>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Meeting Summaries</Label>
                        <p className="text-sm text-muted-foreground">Download meeting summaries in various formats</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm">PDF</Button>
                          <Button variant="outline" size="sm">CSV</Button>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Storage Usage</Label>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Used: 2.1 GB</span>
                            <span>Limit: 10 GB</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '21%' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Integration Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Integrations</CardTitle>
                      <CardDescription>Connect with your favorite tools</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Calendar Integration</Label>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Google Calendar</span>
                          <Button size="sm" variant="outline">Connect</Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Communication Tools</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Slack</span>
                            <Button size="sm" variant="outline">Connect</Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Microsoft Teams</span>
                            <Button size="sm" variant="outline">Connect</Button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Productivity Tools</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Notion</span>
                            <Button size="sm" variant="outline">Connect</Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Jira</span>
                            <Button size="sm" variant="outline">Connect</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
