import lang from '../../lang/lang';
import config from '../../config/defaults';

export default function voicePermissionVerification(message) {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return lang['brazil'].notInVoiceChannel;
  }
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return lang['brazil'].joinPermission;
  }

  if (message.content.trim() === `${config.prefix}play`) {
    return lang['brazil'].emptyPlay;
  }

  return null;
}