/**
 * ai-engine.js - Simulates SIT-BOT AI agent activity
 */
import { store } from './store.js';

export const aiEngine = {
    init() {
        console.log('SIT-BOT AI Engine Online.');
        this.startSimulation();
    },

    startSimulation() {
        const statuses = ['SCANNING', 'SUMMARIZING', 'ANALYZING', 'ON TRACK'];
        const focuses = [
            'Aggregating daily commits...',
            'Summarizing team check-ins...',
            'Calculating sprint velocity...',
            'Identifying potential bottlenecks...'
        ];

        let index = 0;
        setInterval(() => {
            const { team } = store.state;
            const updatedTeam = team.map(member => {
                if (member.isAI) {
                    return {
                        ...member,
                        status: statuses[index],
                        focus: focuses[index]
                    };
                }
                return member;
            });

            store.setState({ team: updatedTeam });
            index = (index + 1) % statuses.length;
        }, 8000); // Update every 8 seconds
    }
};
