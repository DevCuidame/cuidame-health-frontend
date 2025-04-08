export function convertFormattedDateToISO(formattedDate: string): string {
    const months: { [key: string]: string } = {
      "Enero": "01",
      "Febrero": "02",
      "Marzo": "03",
      "Abril": "04",
      "Mayo": "05",
      "Junio": "06",
      "Julio": "07",
      "Agosto": "08",
      "Septiembre": "09",
      "Octubre": "10",
      "Noviembre": "11",
      "Diciembre": "12",
    };
  
    const parts = formattedDate.split(" ");
    if (parts.length < 4) return "";
  
    const day = parts[1];
    const month = months[parts[3]];
    const year = new Date().getFullYear(); 
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }
  