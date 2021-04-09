import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export function formatDate(date: string) {
  return format(new Date(date), "dd  MMM  yyyy'", {
    locale: ptBR,
  });
}

export function formartInHour (date: string) {
  return format(parseISO(date), "'editado em' dd MMM yyyy', às' hh:mm", {
    locale: ptBR,
  });
}
