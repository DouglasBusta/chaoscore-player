# STABLE VERSION — BUSTA FILES V1

This is the first stable checkpoint of the Busta Files archive.

Stable features:
- #chaoscore player still works.
- Busta Files exclusive archive page works.
- Supabase Auth login/sign up works in test mode.
- Account avatar appears after login.
- My Account page opens correctly.
- Saved Files backend connection works.
- Saved files persist after refresh.
- Saved buttons become a checkmark after saving.
- Saved files appear inside My Account.
- Busta Files archive images are indexed from the real available files.
- Empty folders show coming soon instead of broken files.

Known future improvements:
- Private user catalog/profile.
- Better in-app file viewer instead of opening saved files in a new tab.
- Real user uploads with Douglas approval workflow.
- Custom SMTP email from auth@lookapp.org.
- Re-enable email confirmation after custom SMTP setup.
- Favorite tracks and private inbox backend.
- Persistent global audio player across pages.

Rollback command:
git checkout stable-busta-files-v1
