/**
* Gets the root of the page.
* @returns The page
*/
function get_current_page() {
  const url = new URL(location);
  const page_location = url.origin + "/";
  return page_location;
}
