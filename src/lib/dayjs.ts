import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"
import utc from "dayjs/plugin/utc"

dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.extend(utc)

export { dayjs }
