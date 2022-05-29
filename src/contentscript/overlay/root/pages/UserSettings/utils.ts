export function getSemanticProps({
  formContext = {},
  uiSchema = {},
  options = {},
  defaultSchemaProps = { fluid: true, inverted: false },
  defaultContextProps = {},
}: any) {
  const formContextProps = formContext.semantic
  const schemaProps = uiSchema['ui:options'] && uiSchema['ui:options'].semantic
  const optionProps = options.semantic
  // formContext props should overide other props
  return Object.assign(
    {},
    { ...(defaultSchemaProps && defaultSchemaProps) },
    { ...(defaultContextProps && defaultContextProps) },
    schemaProps,
    optionProps,
    formContextProps
  )
}
