import { Router } from 'express';

import bookmarkRoutes from '../bookmarks/routes';
import entriesRoutes from '../entries/routes';
import likesRoutes from '../likes/routes';
import tagsRoutes from '../tags/routes';
import timelineRoutes from '../timeline/routes';
import trashRoutes from '../trash/routes';
import userRoutes from '../users/routes';

const router = Router();

router.use('/users', userRoutes);

router.use('/entries', entriesRoutes);

router.use('/tags', tagsRoutes);

router.use('/bookmarks', bookmarkRoutes);

router.use('/timeline', timelineRoutes);

router.use('/likes', likesRoutes);

router.use('/trash', trashRoutes);
export default router;
