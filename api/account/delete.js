import {
  createSupabaseServerClient,
  parseJsonBody,
  requireAuthenticatedUser,
  sendJson,
} from '../certificates/_utils.js';

function isMissingRelationError(error) {
  if (!error || typeof error !== 'object') return false;
  const code = typeof error.code === 'string' ? error.code : '';
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return code === '42P01' || message.includes('does not exist');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' }, { Allow: 'POST' });
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    const callerUser = await requireAuthenticatedUser(req, supabase);
    if (!callerUser) {
      sendJson(res, 401, { success: false, error: 'Invalid or expired session.' });
      return;
    }

    const body = parseJsonBody(req);
    const requestedUserId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const targetUserId = requestedUserId || callerUser.id;

    if (targetUserId !== callerUser.id) {
      sendJson(res, 403, { success: false, error: 'You can only delete your own account.' });
      return;
    }

    const cleanupTasks = [
      { name: 'user_certificates.user_id', run: () => supabase.from('user_certificates').delete().eq('user_id', targetUserId) },
      { name: 'leaderboard_scores.user_id', run: () => supabase.from('leaderboard_scores').delete().eq('user_id', targetUserId) },
      { name: 'lesson_progress.user_id', run: () => supabase.from('lesson_progress').delete().eq('user_id', targetUserId) },
      { name: 'typing_sessions.user_id', run: () => supabase.from('typing_sessions').delete().eq('user_id', targetUserId) },
      { name: 'typing_tests.user_id', run: () => supabase.from('typing_tests').delete().eq('user_id', targetUserId) },
      { name: 'typing_results.user_id', run: () => supabase.from('typing_results').delete().eq('user_id', targetUserId) },
      { name: 'user_achievements.user_id', run: () => supabase.from('user_achievements').delete().eq('user_id', targetUserId) },
      { name: 'statistics.user_id', run: () => supabase.from('statistics').delete().eq('user_id', targetUserId) },
      { name: 'account_deletion_requests.user_id', run: () => supabase.from('account_deletion_requests').delete().eq('user_id', targetUserId) },
      { name: 'admin_notifications.actor_user_id', run: () => supabase.from('admin_notifications').delete().eq('actor_user_id', targetUserId) },
      { name: 'profiles.id', run: () => supabase.from('profiles').delete().eq('id', targetUserId) },
    ];

    const cleanupErrors = [];
    for (const task of cleanupTasks) {
      const { error } = await task.run();
      if (!error) continue;
      if (isMissingRelationError(error)) continue;
      cleanupErrors.push(`${task.name}: ${error.message}`);
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      sendJson(res, 500, {
        success: false,
        error: deleteError.message || 'Failed to delete account.',
        details: cleanupErrors,
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      message: 'Account deleted successfully.',
      warnings: cleanupErrors,
    });
  } catch (error) {
    console.error('Account delete API failed:', error);
    sendJson(res, 500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete account.',
    });
  }
}
