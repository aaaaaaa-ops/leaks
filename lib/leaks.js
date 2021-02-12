// It might make sense to keep this as logic-less as possible, i.e. no checking
// of severity and flags. This would mean that the database needs to be
// converted once and the rest is just simple loop.

class LeaksPilot {
    constructor(options) {
        const { db, flags = '', title = '', severity = 0 } = options || {}

        this.db = db
        this.flags = flags
        this.title = title
        this.severity = severity
    }

    * generateChecks(options) {
        const { title = this.title, severity = this.severity } = options || {}

        const tests = []

        if (title) {
            tests.push((check) => {
                return (check.title || '').toLowerCase().indexOf(title.toLowerCase()) >= 0
            })
        }

        tests.push((check) => {
            return (check.severity || 10) >= severity
        })

        for (const category of Object.values(this.db)) {
            const { checks } = category

            for (const check of checks) {
                if (tests.every(f => f(check))) {
                    yield check
                }
            }
        }
    }

    * iterateOverSearch(input, options) {
        const { flags = this.flags } = options || {}

        for (const check of this.generateChecks(options)) {
            if (process.env.POWN_DEBUG) {
                console.debug(`starting check ${check.title}`)
                console.time(`leaks: check ${check.title}`)
            }

            const { scan, regex } = check

            if (scan) {
                for (let { index, find } of scan(input, options)) {
                    yield { check, index, find }
                }
            }
            else
            if (regex) {
                // We always set flags to 'g' or we will run into infinite loop
                // problems as per the spec.

                if (process.env.POWN_DEBUG) {
                    console.debug('executing regex', regex)
                }

                const re = new RegExp(regex, (flags || regex.flags || '') + 'g')

                let match

                while ((match = re.exec(input)) !== null) {
                    const { index, 0: find } = match

                    yield { check, index, find }
                }
            }
            else {
                throw new Error(`Unexpected state`)
            }

            if (process.env.POWN_DEBUG) {
                console.timeEnd(`leaks: check ${check.title}`)
            }
        }
    }

    * iterateOverSearchPerCodeLine(input, options) {
        const { tokenizer = /(.+?)[;\n]*$/ } = options || {}

        // We always set flags to 'g' or we will run into infinite loop
        // problems as per the spec.

        const re = new RegExp(tokenizer, 'mg')

        let match

        while ((match = re.exec(input)) !== null) {
            const { index, 1: line } = match

            for (let submatch of this.iterateOverSearch(line, options)) {
                yield { ...submatch, index: index + submatch.index }
            }
        }
    }
}

module.exports = { LeaksPilot }
