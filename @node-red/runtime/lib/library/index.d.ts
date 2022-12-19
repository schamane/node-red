declare function init(_runtime: any): void;
declare function registerType(id: any, type: any): void;
declare function getEntry(library: any, type: any, path: any): any;
declare function saveEntry(library: any, type: any, path: any, meta: any, body: any): any;
declare function getLibraries(): any[];
declare const _default: {
    init: typeof init;
    getLibraries: typeof getLibraries;
    register: typeof registerType;
    getEntry: typeof getEntry;
    saveEntry: typeof saveEntry;
};
export default _default;
