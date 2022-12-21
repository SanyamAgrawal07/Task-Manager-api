const {fahrenheitToCelsius,celsiusToFahrenheit} = require('../src/math')

test('Convert farenheit to celsius' , ()=>{
    const val = fahrenheitToCelsius(32)
    expect(val).toBe(0)
})

test('Convert celsius to farenheit' , ()=>{
    const val = celsiusToFahrenheit(0)
    expect(val).toBe(32)
})