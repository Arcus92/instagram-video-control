import { ReactRoot } from './reactRoot';
import { ReactFiber } from './reactFiber';
import { ReactPriority } from './reactPriority';

/**
 * Defines the React dev hook interface.
 * The dev hook is not intended to be used by third-party developers. It can easily break between React versions.
 * I couldn't find full documentation, so this is just a partial implementation that works with Instagram.
 */
export interface ReactDevToolsHook {
    /**
     * The initial injection callback.
     */
    inject?: (renderer: unknown) => void;

    /**
     * Event when a fiber is rendered / updated.
     */
    onCommitFiberRoot?: (
        rendererId: number,
        root: ReactRoot,
        priorityLevel?: ReactPriority
    ) => void;

    /**
     * Event after a fiber is rendered / updated. Only in React 18+.
     */
    onPostCommitFiberRoot?: (rendererId: number, root: ReactRoot) => void;

    /**
     * Event when a fiber is unmounted / removed.
     */
    onCommitFiberUnmount?: (rendererId: number, fiber: ReactFiber) => void;

    /**
     * Gets if this dev hook is disabled.
     */
    isDisabled?: boolean;

    /**
     * Gets if this dev hook supports the fiber renderer.
     */
    supportsFiber?: boolean;

    /**
     * The registered renderers.
     */
    renderers?: Map<number, unknown>;

    /**
     * Allow additional properties.
     */
    [key: string]: unknown;
}
