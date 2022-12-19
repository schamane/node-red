declare function createProject(user: any, metadata: any): Promise<unknown>;
declare function deleteProject(user: any, projectPath: any): Promise<any>;
declare function loadProject(projectPath: any): Promise<any>;
declare function init(_settings: any, _runtime: any): void;
declare const _default: {
    init: typeof init;
    load: typeof loadProject;
    create: typeof createProject;
    delete: typeof deleteProject;
};
export default _default;
