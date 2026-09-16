export function withHeader(key, value) {
  return { headers: { [key]: value } };
}

export function withHeaders(headers) {
  return { headers: headers ?? {} };
}

export function buildRequestOptions(options = []) {
  const headers = {};
  let signal;
  for (const option of options) {
    if (!option) continue;
    if (option.signal) signal = option.signal;
    const source = option.headers ?? option;
    for (const [key, value] of Object.entries(source)) {
      if (key === 'signal' || value === undefined || value === null) continue;
      headers[key] = Array.isArray(value) ? value.map(String) : String(value);
    }
  }
  return { headers, signal };
}
