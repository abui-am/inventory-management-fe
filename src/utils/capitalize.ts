export default function capitalizeFirstLetter(string: string): string {
  return string.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
}
