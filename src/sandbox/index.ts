const el = document.createElement('div')
el.innerHTML = 'hello from sandbox'
document.body.appendChild(el)

const btn = document.createElement('button')
btn.textContent = 'click me'
btn.onclick = () => {
  console.log('clicked')
}
document.body.appendChild(btn)

eval('console.log("eval executed")')
