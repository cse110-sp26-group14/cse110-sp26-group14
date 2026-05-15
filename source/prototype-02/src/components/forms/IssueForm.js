export function IssueForm() {
    return `
        <form id="issue-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Title</label>
                <input name="title" required style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Severity</label>
                <select name="severity" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Description</label>
                <textarea name="description" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md); height: 80px;"></textarea>
            </div>
            <button type="submit" class="primary-btn" style="width: 100%; justify-content: center;">Create Issue</button>
        </form>
    `;
}
