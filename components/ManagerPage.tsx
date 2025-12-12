
import React, { useState, useMemo } from 'react';
import { Client, Project, Task } from '../types';
import { Plus, Users, Briefcase, TrendingUp, Edit2, Trash2, Power, MoreHorizontal } from 'lucide-react';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { ClientModal } from './modals/ClientModal';
import { ProjectModal } from './modals/ProjectModal';

interface ManagerPageProps {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  onAddClient: (client: Client, newProjects: Partial<Project>[]) => void;
  onUpdateClient: (client: Client, newProjects: Partial<Project>[]) => void;
  onDeleteClient: (id: string) => void;
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const ManagerPage: React.FC<ManagerPageProps> = ({
    clients, projects, tasks,
    onAddClient, onUpdateClient, onDeleteClient,
    onAddProject, onUpdateProject, onDeleteProject
}) => {
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const activeClientsCount = clients.filter(c => c.status === 'ACTIVE').length;
  const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length;
  const totalRevenue = projects.reduce((sum, p) => sum + (p.price || 0), 0);

  // Helper to calculate total spent per client dynamically
  const getClientTotal = (clientId: string) => {
      return projects.filter(p => p.clientId === clientId).reduce((sum, p) => sum + (p.price || 0), 0);
  };

  return (
    <div className="flex flex-col h-full w-full space-y-8 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">
      <FadeIn>
          <div className="flex justify-between items-end mb-6">
              <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Manager</h1>
                  <p className="text-sm text-muted-foreground">Oversee your empire.</p>
              </div>
          </div>
      </FadeIn>

      {/* Graphs / Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FadeIn delay={0.1} className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={20} /></div>
                  <span className="text-xs font-bold text-muted-foreground">ACTIVE CLIENTS</span>
              </div>
              <div className="text-4xl font-bold text-foreground relative z-10">
                  <CountUp value={activeClientsCount} />
              </div>
              {/* Simple decorative graph line */}
              <div className="absolute bottom-0 left-0 w-full h-12 flex items-end opacity-20">
                  <div className="w-1/5 h-[40%] bg-blue-500 mx-1 rounded-t"></div>
                  <div className="w-1/5 h-[60%] bg-blue-500 mx-1 rounded-t"></div>
                  <div className="w-1/5 h-[50%] bg-blue-500 mx-1 rounded-t"></div>
                  <div className="w-1/5 h-[80%] bg-blue-500 mx-1 rounded-t"></div>
                  <div className="w-1/5 h-[100%] bg-blue-500 mx-1 rounded-t"></div>
              </div>
          </FadeIn>

          <FadeIn delay={0.2} className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Briefcase size={20} /></div>
                  <span className="text-xs font-bold text-muted-foreground">ACTIVE PROJECTS</span>
              </div>
              <div className="text-4xl font-bold text-foreground relative z-10">
                  <CountUp value={activeProjectsCount} />
              </div>
              {/* Simple decorative graph line */}
              <div className="absolute bottom-0 left-0 w-full h-12 flex items-end opacity-20">
                  <div className="w-1/5 h-[30%] bg-purple-500 mx-1 rounded-t"></div>
                  <div className="w-1/5 h-[50%] bg-purple-500 mx-1 rounded-t"></div>
                  <div className="w-1/5 h-[70%] bg-purple-500 mx-1 rounded-t"></div>
                  <div className="w-1/5 h-[60%] bg-purple-500 mx-1 rounded-t"></div>
                  <div className="w-1/5 h-[90%] bg-purple-500 mx-1 rounded-t"></div>
              </div>
          </FadeIn>

          <FadeIn delay={0.3} className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><TrendingUp size={20} /></div>
                  <span className="text-xs font-bold text-muted-foreground">TOTAL PIPELINE</span>
              </div>
              <div className="text-4xl font-bold text-foreground relative z-10">
                  <CountUp value={totalRevenue} prefix="$" />
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
          </FadeIn>
      </div>

      {/* Clients Table */}
      <FadeIn delay={0.4}>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-bold text-foreground">Clients</h3>
                  <button 
                    onClick={() => { setSelectedClient(null); setIsClientModalOpen(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-glow"
                  >
                      <Plus size={14} /> Add Client
                  </button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-secondary/30 text-muted-foreground font-bold uppercase text-xs">
                          <tr>
                              <th className="px-6 py-3">Client Name</th>
                              <th className="px-6 py-3">Email</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3">Total Spent</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          {clients.map(client => (
                              <tr key={client.id} className="hover:bg-secondary/20 transition-colors group">
                                  <td className="px-6 py-4 font-bold text-foreground">{client.name}</td>
                                  <td className="px-6 py-4 text-muted-foreground">{client.email || '-'}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${client.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                          {client.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-foreground">${getClientTotal(client.id).toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => { setSelectedClient(client); setIsClientModalOpen(true); }} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                                              <Edit2 size={14} />
                                          </button>
                                          <button onClick={() => onUpdateClient({ ...client, status: client.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }, [])} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground" title="Toggle Active">
                                              <Power size={14} />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                          {clients.length === 0 && (
                              <tr>
                                  <td colSpan={5} className="text-center py-8 text-muted-foreground">No clients added.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </FadeIn>

      {/* Projects Table */}
      <FadeIn delay={0.5}>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-bold text-foreground">Projects</h3>
                  <button 
                    onClick={() => { setSelectedProject(null); setIsProjectModalOpen(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-foreground text-xs font-bold rounded-lg hover:bg-secondary/80 border border-border transition-colors"
                  >
                      <Plus size={14} /> Add Project
                  </button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-secondary/30 text-muted-foreground font-bold uppercase text-xs">
                          <tr>
                              <th className="px-6 py-3">Project Title</th>
                              <th className="px-6 py-3">Client</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3">Value</th>
                              <th className="px-6 py-3">Deadline</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          {projects.map(project => (
                              <tr key={project.id} className="hover:bg-secondary/20 transition-colors group">
                                  <td className="px-6 py-4 font-bold text-foreground">
                                      <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }}></div>
                                          {project.title}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-muted-foreground">{project.client}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${project.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                          {project.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-foreground">${project.price?.toLocaleString() || '0'}</td>
                                  <td className="px-6 py-4 text-muted-foreground">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '-'}</td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => { setSelectedProject(project); setIsProjectModalOpen(true); }} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                                              <Edit2 size={14} />
                                          </button>
                                          <button onClick={() => onDeleteProject(project.id)} className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500">
                                              <Trash2 size={14} />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                          {projects.length === 0 && (
                              <tr>
                                  <td colSpan={6} className="text-center py-8 text-muted-foreground">No projects found.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </FadeIn>

      <ClientModal 
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSave={onAddClient}
          onDelete={onDeleteClient}
          initialClient={selectedClient}
          existingProjects={projects}
      />

      <ProjectModal 
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onSave={(p) => {
              if (selectedProject) onUpdateProject({ ...selectedProject, ...p });
              else onAddProject({ id: Date.now().toString(), tags: [], progress: 0, ...p } as Project);
          }}
          onDelete={onDeleteProject}
          initialProject={selectedProject}
          allTasks={tasks}
          clients={clients}
      />
    </div>
  );
};
