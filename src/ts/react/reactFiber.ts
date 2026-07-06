import { ReactTag } from './reactTag';
import { ReactFlags } from './reactFlags';

export interface ReactFiber {
    /**
     * The tag of the element.
     */
    tag: ReactTag;

    /**
     * The change flags of this element.
     */
    flags: ReactFlags;

    /**
     * The change flags of the subtree.
     */
    subtreeFlags: ReactFlags;

    /**
     * The type information. This is a string is this is a native HTML element.
     */
    type: string | ((() => void) & { displayName: string });

    /**
     * The next sibling element.
     */
    sibling: ReactFiber | null;

    /**
     * The child element.
     */
    child: ReactFiber | null;

    /**
     * The parent element.
     */
    return: ReactFiber | null;

    /**
     * The alternate element for switching states.
     */
    alternate: ReactFiber | null;

    /**
     * The current state properties.
     */
    memoizedProps: unknown;

    /**
     * The DOM element.
     */
    stateNode: HTMLElement | unknown | null;
}
