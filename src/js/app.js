const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const operators = ['+', '-', '*', '/']

document.addEventListener('click', handleClick)

// Add an event listener for clicks
function handleClick(e) {
  const value = e.target.dataset.value

  // Check if the element with the result was clicked and copy the text to the clipboard
  if (e.target.hasAttribute('data-result')) {
    Calculator.copyText(e.target)
    return
  }

  // Handle clicks on number and operator buttons
  if (numbers.includes(+value)) {
    Calculator.input(value)
    return
  }

  if (operators.includes(value)) {
    Calculator.changeOperator(value)
    return
  }

  // Handle special keys (C, ., +/-, =, %)
  switch (value) {
    case 'C':
      Calculator.clear()
      break
    case '.':
      Calculator.input('.')
      break
    case '+-':
      Calculator.reverseSign()
      break
    case '=':
      Calculator.calculate()
      break
    case '%':
      Calculator.percent()
      break
  }
}

// Calculator class with static methods
class Calculator {
  // Object initialization
  static init() {
    this.$display = document.querySelector('[data-result]')
    this.currentValue = '0'
    this.result = 0
    this.operator = ''
    this.isChangeOperator = false
    this.isCalculated = false
    this.hasComma = false
    this.isCleared = false
  }

  // Static method for inputting values
  static input(i) {
    // If the operator has just changed or a calculation has been performed, clear the current value
    if (this.isChangeOperator || this.isCalculated) {
      this.currentValue = '0'
      this.isChangeOperator = false
      this.isCalculated = false
    }

    // Limit the number of characters in the input (max 9 or 10 with a comma)
    if (this.currentValue.length >= (this.hasComma ? 10 : 9)) return

    // Handling of a comma
    if (i === '.' && this.hasComma) return
    this.hasComma = i === '.' ? true : this.hasComma

    // Handling of the initial value
    if (this.currentValue === '0' && i !== '.') this.currentValue = ''
    else if (this.currentValue === '-0' && i !== '.') this.currentValue = '-'

    // Mark that the value is not cleared, add the entered value, and output the result
    this.setIsCleared(false)
    this.currentValue += i
    this.output()
  }

  // Static method to reverse the sign
  static reverseSign() {
    this.currentValue = this.currentValue.toString()
    this.currentValue = this.currentValue[0] === '-' ? this.currentValue.slice(1) : `-${this.currentValue}`

    this.output()
  }

  // Static method to calculate percentages
  static percent() {
    const percentage = this.result ? this.result / 100 : 0.01
    const result = this.currentValue * percentage

    this.currentValue = this.checkResult(result).toString()
    this.output()
  }

  // Static method to change the operator
  static changeOperator(operator) {
    if (!this.isChangeOperator && this.operator) this.calculate()

    this.setOperator(operator)
    this.result = parseFloat(this.currentValue)
    this.isChangeOperator = true
    this.hasComma = false
  }

  // Static method to perform calculations and obtain the result
  static calculate() {
    const currentValueAsNum = +this.currentValue

    switch (this.operator) {
      case '+':
        this.result += currentValueAsNum
        break
      case '-':
        this.result -= currentValueAsNum
        break
      case '*':
        this.result *= currentValueAsNum
        break
      case '/':
        if (currentValueAsNum === 0) return
        this.result /= currentValueAsNum
        break
    }

    // Check and output the result
    this.currentValue = this.result = this.checkResult(this.result)
    this.setOperator('')
    this.isCalculated = true
    this.output()
  }

  // Static method to check and format the result
  static checkResult(number) {
    const stringValue = number.toString()
    const [toDecimal, afterDecimal] = stringValue.split('.')

    if (stringValue.length > 10) {
      if (stringValue.indexOf('e-') !== -1) {
        // Reduce the negative exponential number
        const indexExponent = stringValue.indexOf('e-')

        return `${toDecimal + stringValue.slice(indexExponent)}`
      }
      if (toDecimal.length > 10) {
        // Convert to exponential number
        const exponentValue = number.toExponential(5).replace('+', '')
        const [num, e] = exponentValue.split('e')
        const filteredNum = this.delZeroInNumber(num)

        return `${filteredNum}e${e}`
      }
      if (afterDecimal.length > 0) {
        // Reduce the floating-point number
        const length = Math.max(0, 9 - toDecimal.length)
        const toFixedNum = number.toFixed(length)

        return this.delZeroInNumber(toFixedNum)
      }
    }
    return number
  }

  // Static method to clear the value
  static clear() {
    if (this.isCleared) {
      this.allClear()
      return
    }

    this.currentValue = '0'
    this.hasComma = false
    this.output()
    this.setIsCleared(true)
  }

  // Static method for full clearing
  static allClear() {
    this.currentValue = '0'
    this.result = 0
    this.setOperator('')
    this.isChangeOperator = false
    this.isCalculated = false
    this.hasComma = false
    this.output()
  }

  // Static method to output the result on the screen
  static output() {
    this.$display.textContent = this.currentValue
  }

  // Static method to set the cleared flag
  static setIsCleared(bool) {
    this.isCleared = bool
    this.changeBtnClear(bool)
  }

  // Static method to set the operator
  static setOperator(operator) {
    this.operator = operator
    this.changeActiveBtn()
  }

  // Static method to change the active operator button
  static changeActiveBtn() {
    const btns = operators.map(el => document.querySelector(`[data-value="${el}"]`))
    const $currentBtn = btns.find(el => el.dataset.value === this.operator)

    btns.forEach($el => $el.classList.remove('_active'))
    $currentBtn?.classList.add('_active')
  }

  // Static method to change the text on the clear button
  static changeBtnClear(bool) {
    const $btn = document.querySelector('[data-value="C"]')
    $btn.textContent = bool ? 'AC' : 'C'
  }

  // Static method to remove zeros in a number
  static delZeroInNumber(number) {
    let isNum = false

    const filteredNum = number
      .split('')
      .reverse()
      .reduce((result, digit) => {
        if (digit !== '0' && digit !== '.') {
          isNum = true
        }

        if (isNum) {
          result.unshift(digit)
        }

        return result
      }, [])
      .join('')

    return filteredNum
  }

  // Async static method for copying text to the clipboard
  static async copyText() {
    try {
      const text = this.$display.textContent
      await navigator.clipboard.writeText(text)
      this.toggleClassAfterCopy()
    } catch (err) {
      console.error('Unable to copy text to clipboard', err)
    }
  }

  // Static method to toggle the '_active' class on the display element after copy
  static toggleClassAfterCopy() {
    this.$display.classList.add('_active')
    setTimeout(() => {
      this.$display.classList.remove('_active')
    }, 10)
  }
}

// Initialization of the calculator when the page is loaded
Calculator.init()
