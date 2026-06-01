/**
 * Controls a modal dialog: caches its DOM parts, wires close behavior once,
 * and exposes show/close methods.
 */
export class Modal {
    /**
     * Caches the modal's title, content, close-button, and overlay elements,
     * and wires click-to-close on the button and overlay (guarded so the
     * listeners are attached only once per host element).
     * @param {HTMLElement} host - The modal's root element, expected to contain `#modal-title`, `#modal-content`, `.close-modal`, and `.modal-overlay`.
     */
    constructor(host) {
        this.host = host;
        this.title = host.querySelector('#modal-title');
        this.content = host.querySelector('#modal-content');
        this.closeButton = host.querySelector('.close-modal');
        this.overlay = host.querySelector('.modal-overlay');

        if (host.dataset.modalCloseWired !== '1') {
            host.dataset.modalCloseWired = '1';
            this.closeButton.addEventListener('click', () => this.close());
            this.overlay.addEventListener('click', () => this.close());
        }
    }

    /**
     * Sets the modal's title and content, then reveals it by removing `hidden`.
     * @param {string} title - Text assigned to the title element via `innerText`.
     * @param {string} contentHTML - HTML assigned to the content element via `innerHTML`.
     * @returns {void}
     */
    show(title, contentHTML) {
        this.title.innerText = title;
        this.content.innerHTML = contentHTML;
        this.host.classList.remove('hidden');
    }

    /**
     * Hides the modal by adding the `hidden` class to its host element.
     * @returns {void}
     */
    close() {
        this.host.classList.add('hidden');
    }
}