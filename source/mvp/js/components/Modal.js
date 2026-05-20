export class Modal {
    constructor(host) {
        this.host = host;
        this.title = host.querySelector('#modal-title');
        this.content = host.querySelector('#modal-content');
        this.closeButton = host.querySelector('.close-modal');
        this.overlay = host.querySelector('.modal-overlay');

        this.closeButton.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());
    }

    show(title, contentHTML) {
        this.title.innerText = title;
        this.content.innerHTML = contentHTML;
        this.host.classList.remove('hidden');
    }

    close() {
        this.host.classList.add('hidden');
    }
}
