function markedLocalTime() {
  function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    const til = seconds < 0;
    if (til) {
      seconds = Math.abs(seconds);
    }

    var interval = seconds / 31536000;
    if (interval > 1) {
      return (til ? "in " : "") + Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return (til ? "in " : "") + Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return (til ? "in " : "") + Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return (til ? "in " : "") + Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return (til ? "in " : "") + Math.floor(interval) + " minutes";
    }
    return (til ? "in " : "") + Math.floor(seconds) + " seconds";
  }

  function time_with_0(time) {
    if (time < 10) {
      return `0${time}`;
    }
    return `${time}`;
  }

  function format_time(time, format) {
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const t = new Date(time * 1000);
    switch (format) {
      case 't': // 19:32
        return `${time_with_0(t.getHours())}:${time_with_0(t.getMinutes())}`;
      case 'T': // 19:32:45
        return `${t.toLocaleTimeString()}`;
      case 'd': // 15/02/2024, or the equliviant locale
        return `${t.toLocaleDateString()}`;
      case 'D': // 15 Februrary 2024
        return `${time_with_0(t.getDate())} ${months[t.getMonth()]} ${t.getFullYear()}`;
      case 'f': // 15 Feburary 2024 at 19:33
        return `${time_with_0(t.getDate())} ${months[t.getMonth()]} ${t.getFullYear()} at ${time_with_0(t.getHours())}:${time_with_0(t.getMinutes())}`;
      case 'F': // Saturday 15 Feburary 2024 at 19:33
        return `${weekDays[t.getDay()]} ${time_with_0(t.getDate())} ${months[t.getMonth()]} ${t.getFullYear()} at ${time_with_0(t.getHours())}:${time_with_0(t.getMinutes())}`;
      case 'R': // 2 minutes ago / in 3 years
        return `${timeSince(t)}`;
      default: // same as 'f'
        return t.toLocaleString();
    }
  }

  return {
    extensions: [{
      name: 'localtime',
      level: 'inline',
      start(src) {
        const start = src.match(/<t:/)?.index;
        return start === undefined || (start > 0 && src[start - 1] === '`') ? undefined : start;
      },
      tokenizer(src, tokens) {
        const rule = /^<t:(\d*)(:([tTdDfFR]))?>/;
        const match = rule.exec(src);

        return (match) ? {
          type: 'localtime',
          raw: match[0],
          time: Number(match[1]),
          format: match[3] == undefined ? 'f' : match[3],
        } : undefined
      },
      renderer(token) {
        return `<code>${format_time(token.time, token.format)}</code>`;
      },
    }
    ]
  }
}
