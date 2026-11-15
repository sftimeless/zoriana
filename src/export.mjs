// Plain CSV text from rows of values. Fields with commas, quotes or line breaks are quoted.
export function toCsv(rows){
 const field=v=>{const s=v===null||v===undefined?'':String(v);return /[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};
 return rows.map(row=>row.map(field).join(',')).join('\r\n')+'\r\n';
}
