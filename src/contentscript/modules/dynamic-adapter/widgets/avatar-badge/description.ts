export default {
  img: {
    description: 'image as blob',
    optional: true,
    TYPE: 'string | null',
  },
  video: {
    description: 'video as blob',
    optional: true,
    TYPE: 'string',
  },
  mediaType: {
    description: 'type of media item: image or video',
    optional: true,
    TYPE: 'string',
  },
  basic: {
    description:
      'By default there are a gray background and a border. In case of true there are no background and border. The image/video have not border radius',
    optional: true,
    TYPE: 'boolean',
  },
  horizontal: {
    description: 'sets a horizontal position',
    optional: true,
    TYPE: "'left' | 'right'",
  },
  vertical: {
    description: 'sets a vertical position',
    optional: true,
    TYPE: "'top' | 'bottom'",
  },
  tooltip: {
    description: 'text tooltip',
    optional: true,
    TYPE: 'string',
  },
  theme: {
    description: "'DARK' | 'LIGHT'",
    optional: true,
    TYPE: 'string',
  },
  hidden: {
    description: 'hides the widget',
    optional: true,
    TYPE: 'boolean',
  },
  exec: {
    description: 'action on click',
    optional: true,
    TYPE: '(ctx: any, me: IAvatarBadgeState) => void',
  },
  init: {
    description: 'action through initialisation',
    optional: true,
    TYPE: '(ctx: any, me: IAvatarBadgeState) => void',
  },
}
