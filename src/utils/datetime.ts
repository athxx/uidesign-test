export function getDatetimeInfo(dateArgs?: any) {
  let date: Date

  if (typeof dateArgs === 'undefined') {
    date = new Date()
  } else {
    date = new Date(dateArgs)
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
  }
}
