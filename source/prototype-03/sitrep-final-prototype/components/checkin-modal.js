/**
 * checkin-modal.js - High-fidelity modal for new check-ins
 */
import { store } from '../store.js';
import { db } from '../db.js';

class CheckinModal extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    show() {
        this.querySelector('.modal-overlay').style.display = 'grid';
    }

    hide() {
        this.querySelector('.modal-overlay').style.display = 'none';
    }

    render() {
        this.innerHTML = `
            <div class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); z-index: 1000; place-items: center; padding: 1rem;">
                <div class="card" style="width: 100%; max-width: 500px; padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                    <div class="flex justify-between items-center" style="margin-bottom: 2rem;">
                        <div>
                            <h2 style="color: white; font-size: 1.25rem;">New Check-in</h2>
                            <p style="font-size: 0.75rem; color: var(--text-secondary);">Update your team on today's focus and hurdles.</p>
                        </div>
                        <i data-lucide="x" class="close-btn" style="cursor: pointer; color: var(--text-muted); width: 20px;"></i>
                    </div>

                    <form id="checkin-form" style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <div>
                            <label style="font-size: 0.625rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem; display: block;">What are you focusing on today?</label>
                            <textarea name="focus" placeholder="e.g. Refactoring the auth middleware..." style="width: 100%; background: #111112; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem; color: white; resize: none; height: 80px;"></textarea>
                        </div>

                        <div class="flex gap-4">
                            <div style="flex: 1;">
                                <label style="font-size: 0.625rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem; display: block;">Current Status</label>
                                <select name="status" style="width: 100%; background: #111112; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem; color: white;">
                                    <option value="In Progress">🟢 In Progress</option>
                                    <option value="On Track">🔵 On Track</option>
                                    <option value="Review">🟡 Review</option>
                                    <option value="Blocked">🔴 Blocked</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label style="font-size: 0.625rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem; display: block;">How is your mood?</label>
                                <div class="mood-picker flex justify-between" style="background: #111112; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.5rem;">
                                    <span style="cursor: pointer; padding: 4px;">🔥</span>
                                    <span style="cursor: pointer; padding: 4px;">⚡</span>
                                    <span style="cursor: pointer; padding: 4px;">☕</span>
                                    <span style="cursor: pointer; padding: 4px;">🎯</span>
                                    <span style="cursor: pointer; padding: 4px;">🚀</span>
                                </div>
                                <input type="hidden" name="mood" value="🙂">
                            </div>
                        </div>

                        <div>
                            <label style="font-size: 0.625rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem; display: block;">Are you blocked?</label>
                            <textarea name="blockers" placeholder="Mention any dependencies or technical debt holding you back..." style="width: 100%; background: #111112; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem; color: white; resize: none; height: 60px;"></textarea>
                        </div>

                        <div style="background: #111112; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; display: flex; justify-between items-center;">
                            <div class="flex items-center gap-3">
                                <div style="width: 32px; height: 32px; background: rgba(59, 130, 246, 0.1); border-radius: 50%; display: grid; place-items: center;">
                                    <i data-lucide="headset" style="color: #3B82F6; width: 16px;"></i>
                                </div>
                                <div>
                                    <div style="font-size: 0.875rem; font-weight: 600;">Needs Coverage?</div>
                                    <div style="font-size: 0.625rem; color: var(--text-muted);">Request extra hands for your current task.</div>
                                </div>
                            </div>
                            <div style="width: 36px; height: 20px; background: #27272A; border-radius: 10px; position: relative; cursor: pointer;">
                                <div style="width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; left: 2px; top: 2px;"></div>
                            </div>
                        </div>

                        <div class="flex justify-end gap-3" style="margin-top: 1rem;">
                            <button type="button" class="btn btn-outline close-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary" style="background: var(--accent);">Submit Check-in <i data-lucide="send" style="width: 14px; margin-left: 0.5rem;"></i></button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Event Listeners
        this.querySelectorAll('.close-btn').forEach(btn => btn.onclick = () => this.hide());
        
        const moodPicker = this.querySelector('.mood-picker');
        moodPicker.onclick = (e) => {
            if (e.target.tagName === 'SPAN') {
                this.querySelector('input[name="mood"]').value = e.target.innerText;
                [...moodPicker.children].forEach(child => child.style.background = 'transparent');
                e.target.style.background = 'var(--accent-muted)';
                e.target.style.borderRadius = '4px';
            }
        };

        this.querySelector('form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const checkin = {
                id: Date.now(),
                person: 'Jacky Yu', // Hardcoded for prototype
                focus: formData.get('focus'),
                status: formData.get('status'),
                mood: formData.get('mood'),
                blockers: formData.get('blockers'),
                timestamp: new Date().toISOString()
            };

            await db.saveCheckin(checkin);
            const history = await db.getAllCheckins();
            store.setState({ checkins: history });
            
            this.hide();
            e.target.reset();
        };

        if (window.lucide) window.lucide.createIcons();
    }
}

customElements.define('checkin-modal', CheckinModal);
