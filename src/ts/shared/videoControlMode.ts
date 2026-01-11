export enum VideoControlMode {
    // The controls are disabled. There are no video controls. This is Instagram without modification.
    disabled = 'disabled',

    // The custom controls are used. These look identical in Firefox and Chrome.
    custom = 'custom',

    // The native browser controls. We take whatever the browser provides and have no control over it.
    native = 'native',
}
