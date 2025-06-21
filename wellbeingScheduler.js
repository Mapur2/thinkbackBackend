import cron from 'node-cron';
import User from './models/User.js';
import { analyzeUserWellbeing } from './controllers/wellbeingController.js';

const startWellbeingScheduler = () => {
    // Schedule the job to run once every day at 3:00 AM server time.
    cron.schedule('0 3 * * *', async () => {
        console.log('Running daily wellbeing analysis job...');
        
        try {
            // Find all users. In a large-scale app, you might only select users
            // who have been active in the last week.
            const users = await User.find({}).select('_id');

            console.log(`Found ${users.length} users to analyze.`);

            // Sequentially process each user to avoid overwhelming the system.
            for (const user of users) {
                await analyzeUserWellbeing(user._id);
            }

            console.log('Daily wellbeing analysis job finished.');
        } catch (error) {
            console.error('Error during scheduled wellbeing analysis job:', error);
        }
    });

    console.log('Well-being Tracker scheduler has been initialized.');
};

export { startWellbeingScheduler }; 