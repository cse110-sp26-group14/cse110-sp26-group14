export function DailyCheckInForm() {
    return `
        <form id="checkin-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Mood</label>
                <select name="mood" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
                    <option>Good</option>
                    <option>Neutral</option>
                    <option>Stressed</option>
                </select>
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">What did you work on?</label>
                <textarea name="progress" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md); height: 80px;"></textarea>
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Any blockers?</label>
                <input name="blockers" type="text" placeholder="None" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
            </div>
            <button type="submit" class="primary-btn" style="width: 100%; justify-content: center;">Submit Check-In</button>
        </form>
    `;
}
