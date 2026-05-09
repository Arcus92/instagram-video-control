import { ReactDevToolsHook } from '../react/reactDevToolsHook';

declare global {
    interface Window {
        __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook;
    }
}

export {};
