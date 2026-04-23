import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../../api";
import { queryKeys } from "../../api/queryKeys";
import { getUserInitials } from "../../lib/utils";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, activeProject, setActiveProject, currentUser } = useAppStore();
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: getProjects,
  });

  const currentProject =
    projects.find((p) => p.id === projectId) ?? activeProject;

  function handleProjectClick(project) {
    setActiveProject(project);
    navigate(`/projects/${project.id}/board`);
  }

  return (
    <aside
      style={{ width: sidebarCollapsed ? "56px" : "224px" }}
      className="flex flex-col border-r border-slate-800 bg-sidebar transition-all duration-300 shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 h-14 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500 shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        {!sidebarCollapsed && (
          <span className="font-semibold text-sm text-white">ProjectFlow</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">

        {/* Projects section */}
        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-2 pb-1">
            Projects
          </p>
        )}
        <div className="space-y-0.5 mb-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleProjectClick(project)}
              title={sidebarCollapsed ? project.name : undefined}
              className={`flex items-center gap-2.5 w-full px-2 h-8 rounded-md text-sm transition-colors ${
                sidebarCollapsed ? "justify-center" : ""
              } ${
                currentProject?.id === project.id
                  ? "bg-slate-800 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center w-4 h-4 rounded bg-blue-500/30 text-blue-300 text-[9px] font-bold shrink-0">
                {project.key.slice(0, 1)}
              </div>
              {!sidebarCollapsed && (
                <span className="truncate text-left">{project.name}</span>
              )}
            </button>
          ))}

          {/* Link to all projects */}
          <NavLink
            to="/projects"
            title={sidebarCollapsed ? "All Projects" : undefined}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2 h-8 rounded-md text-sm transition-colors ${
                sidebarCollapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-slate-800 text-white font-medium"
                  : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
              }`
            }
          >
            <span className="text-base leading-none">⊞</span>
            {!sidebarCollapsed && <span className="truncate">All Projects</span>}
          </NavLink>
        </div>

        {/* Current project nav */}
        {currentProject && (
          <>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-2 pt-2 pb-1 truncate">
                {currentProject.key} · {currentProject.name}
              </p>
            )}
            <div className="space-y-0.5">
              <NavItem
                to={`/projects/${currentProject.id}/board`}
                label="Board"
                collapsed={sidebarCollapsed}
                icon="⊞"
              />
              <NavItem
                to={`/projects/${currentProject.id}/backlog`}
                label="Backlog"
                collapsed={sidebarCollapsed}
                icon="☰"
              />
            </div>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 pt-3 border-t border-slate-800 space-y-0.5">
        {/* Current user */}
        {currentUser && (
          <div className={`flex items-center gap-2 px-2 py-2 mb-1 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-bold shrink-0">
              {getUserInitials(currentUser.firstName, currentUser.lastName)}
            </div>
            {!sidebarCollapsed && (
              <span className="text-xs text-slate-400 truncate">
                {currentUser.firstName} {currentUser.lastName}
              </span>
            )}
          </div>
        )}

        <NavItem
          to="/settings"
          label="Settings"
          collapsed={sidebarCollapsed}
          icon="⚙"
        />
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-8 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {sidebarCollapsed ? "→" : "←"}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ to, icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2 h-8 rounded-md text-sm transition-colors ${
          collapsed ? "justify-center" : ""
        } ${
          isActive
            ? "bg-slate-800 text-white font-medium"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
        }`
      }
    >
      <span>{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}