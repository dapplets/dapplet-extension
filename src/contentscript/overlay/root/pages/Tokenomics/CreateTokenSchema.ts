import * as Yup from 'yup'
const MAX_ALLOWED_ICON_WIDTH = 128
const MAX_ALLOWED_ICON_HEIGHT = 128

const EXTENSION_UNSUPPORTED = 'Only PNG or SVG supported'
const FILE_DIMENSIONS_VIOLATION = 'Image dimensions are larger than 128px*128px'

const observeImage = (image: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(image)
    const img = new Image()
    img.onload = () => {
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

Yup.addMethod(Yup.mixed, 'isValidIcon', function () {
  const message = EXTENSION_UNSUPPORTED
  return this.test('test-extension', message, async function (image: File) {
    const { createError } = this

    if (!image) return true

    const isSupportedExt = image.type === 'image/svg+xml' || image.type === 'image/png'

    if (!isSupportedExt) {
      return createError({
        message,
      })
    }

    const isRasterImage = image.type === 'image/png'

    if (isRasterImage) {
      try {
        const imageData: HTMLImageElement = await observeImage(image)

        if (imageData.width > MAX_ALLOWED_ICON_WIDTH)
          return createError({ message: FILE_DIMENSIONS_VIOLATION })

        if (imageData.width > MAX_ALLOWED_ICON_HEIGHT)
          return createError({ message: FILE_DIMENSIONS_VIOLATION })
      } catch (error) {
        return createError({
          message,
        })
      }
    }

    return true
  })
})

const CreateTokenSchema = Yup.object().shape({
  name: Yup.string()
    .matches(/^(?!\s*$)[-\\/'", 0-9a-zA-Z]+$/gm, 'Please enter english only')
    .max(16, 'Too Long!')
    .required('Required field')
    .trim(),
  symbol: Yup.string()
    .matches(/^(?!\s*$)[-\\/'", 0-9a-zA-Z]+$/gm, 'Please enter english only')
    .min(3, 'Too Short!')
    .max(4, 'Too Long!')
    .required('Required field')
    .trim(),
  icon: Yup.mixed()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Yup addMethod is too hard to use with TS, let it be this way at least for now
    .isValidIcon()
    .required('Required field'),
  decimals: Yup.string().required('Required'),
})

export default CreateTokenSchema
