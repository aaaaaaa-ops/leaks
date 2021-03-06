const assert = require('assert')

const db = require('../lib/db')

describe('db', () => {
    it('db is ok', () => {
        assert.ok(db, 'db exists')

        Object.entries(db).forEach(([name, { checks }]) => {
            checks.forEach((check, index) => {
                assert.ok(check.title, `title exists for ${name}.${index}`)
            })
        })
    })

    it('db checks validate', () => {
        const first = (it) => Array.from(it)[0]

        Object.entries(db).forEach(([name, { checks }]) => {
            checks.forEach((check) => {
                const { title, test, tests = [] } = check

                assert.ok(!test)

                if (tests) {
                    const { possitive, negative } = tests

                    if (possitive) {
                        const { scan } = check

                        possitive.forEach((test, index) => {
                            const result = first(scan(test))

                            assert.ok(result, `${JSON.stringify(title)} validates against possitive test ${JSON.stringify(test)} at index ${index}`)
                        })
                    }

                    if (negative) {
                        const { scan } = check

                        negative.forEach((test, index) => {
                            const result = first(scan(test))

                            assert.ok(!result, `${JSON.stringify(title)} validates against negative test ${JSON.stringify(test)} at index ${index}`)
                        })
                    }
                }
            })
        })
    })
})
