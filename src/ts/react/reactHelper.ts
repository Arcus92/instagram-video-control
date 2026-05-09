import { ReactFiber } from './reactFiber';

export class ReactHelper {
    /**
     * Gets the React root fiber element of the page.
     */
    public static getFiberFromDocument(): ReactFiber | undefined {
        if (!document.body) return;
        for (const node of document.body.childNodes) {
            const key = Object.keys(node).find((p) =>
                p.startsWith('__reactContainer')
            );
            if (!key) continue;
            // @ts-expect-error TS7053
            return node[key] as ReactFiber;
        }
    }

    /**
     * Gets the React fiber element of the given DOM element.
     * @param node The DOM element to get the fiber for.
     */
    public static getFiberFromNode(node: Node): ReactFiber | undefined {
        const key = Object.keys(node).find((p) => p.startsWith('__reactFiber'));
        if (key) {
            // @ts-expect-error TS7053
            return node[key] as ReactFiber;
        }
    }

    /**
     * Returns the DOM element of the given fiber node.
     * @param fiber The fiber node.
     */
    public static getNodeFromFiber(
        fiber?: ReactFiber
    ): HTMLElement | undefined {
        if (!fiber) return undefined;
        if (fiber.stateNode instanceof HTMLElement) {
            return fiber.stateNode;
        }
        if (fiber.child) return this.getNodeFromFiber(fiber.child);
    }

    /**
     * Traversals the React fiber tree down and executes the callback function for every element.
     * If the callback function returns a value, the traversal is stopped and the value is returned.
     * @param fiber The starting fiber node.
     * @param callback The callback function to execute for each element.
     */
    public static traversalChildren<T>(
        fiber: ReactFiber | undefined,
        callback: (fiber: ReactFiber) => T | undefined
    ): T | undefined {
        if (!fiber) return;
        let result = callback(fiber);
        if (result) return result;
        if (fiber.sibling) {
            result = this.traversalChildren(fiber.sibling, callback);
            if (result) return result;
        }
        if (fiber.child) {
            result = this.traversalChildren(fiber.child, callback);
            if (result) return result;
        }
    }

    /**
     * Traversals the React fiber tree up and executes the callback function for every element.
     * If the callback function returns a value, the traversal is stopped and the value is returned.
     * @param fiber The starting fiber node.
     * @param callback The callback function to execute for each element.
     */
    public static traversalParents<T>(
        fiber: ReactFiber | undefined,
        callback: (fiber: ReactFiber) => T | undefined
    ): T | undefined {
        if (!fiber) return;
        let result = callback(fiber);
        if (result) return result;
        if (fiber.return) {
            result = this.traversalParents(fiber.return, callback);
            if (result) return result;
        }
    }

    /**
     * Returns the class name of the given fiber node.
     * @param fiber The fiber node.
     */
    public static getName(fiber: ReactFiber): string {
        if (typeof fiber.type === 'string') return fiber.type;
        if (typeof fiber.type === 'function') return fiber.type.displayName;
        return '';
    }

    /**
     * Executes the callback function for every fiber node in the root fiber tree where the class matches the given name.
     * @param root The root fiber node.
     * @param names The class names to match.
     * @param callback The callback function to execute for each fiber node.
     */
    public static traversalChildrenByName<T>(
        root: ReactFiber | undefined,
        names: string[],
        callback: (fiber: ReactFiber) => T
    ): T | undefined {
        const lookupNames = names.map((name) => `[from ${name}.react]`);
        return this.traversalChildren(root, (fiber) => {
            const className = this.getName(fiber);
            if (
                className &&
                (names.includes(className) ||
                    lookupNames.some((lookupName) =>
                        className.endsWith(lookupName)
                    ))
            )
                return callback(fiber);
        });
    }

    /**
     * Returns the first child fiber node with the given name.
     * @param root The root fiber node.
     * @param names The class names to match.
     */
    public static getChildByName(
        root: ReactFiber | undefined,
        ...names: string[]
    ) {
        return this.traversalChildrenByName(root, names, (fiber) => fiber);
    }

    /**
     * Executes the callback function for every fiber node in the root fiber tree where the class matches the given name.
     * @param root The root fiber node.
     * @param names The class names to match.
     * @param callback The callback function to execute for each fiber node.
     */
    public static traversalParentsByName<T>(
        root: ReactFiber | undefined,
        names: string[],
        callback: (fiber: ReactFiber) => T
    ): T | undefined {
        const lookupNames = names.map((name) => `[from ${name}.react]`);
        return this.traversalParents(root, (fiber) => {
            const className = this.getName(fiber);
            if (
                className &&
                (names.includes(className) ||
                    lookupNames.some((lookupName) =>
                        className.endsWith(lookupName)
                    ))
            )
                return callback(fiber);
        });
    }

    /**
     * Returns the first parent fiber node with the given name.
     * @param root The root fiber node.
     * @param names The class names to match.
     */
    public static getParentByName(
        root: ReactFiber | undefined,
        ...names: string[]
    ): ReactFiber | undefined {
        return this.traversalParentsByName(root, names, (fiber) => fiber);
    }

    public static traversal(
        fiber: ReactFiber,
        options: {
            reverse?: boolean;
            filter?: (fiber: ReactFiber) => boolean;
            subtreeFilter?: (fiber: ReactFiber) => boolean;
            callback: (fiber: ReactFiber) => void;
        }
    ) {
        if (!options.filter || options.filter(fiber)) {
            options.callback(fiber);
        }

        if (options.reverse) {
            if (fiber.return) {
                if (!options.subtreeFilter || options.subtreeFilter(fiber)) {
                    this.traversal(fiber.return, options);
                }
            }
        } else {
            if (fiber.sibling) {
                this.traversal(fiber.sibling, options);
            }
            if (fiber.child) {
                if (!options.subtreeFilter || options.subtreeFilter(fiber)) {
                    this.traversal(fiber.child, options);
                }
            }
        }
    }
}
