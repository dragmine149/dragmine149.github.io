use rss::{Category, CategoryBuilder, Channel, ChannelBuilder, Item, ItemBuilder};
use serde::{Deserialize, Serialize};
use std::{cmp::Ordering, ffi::OsStr, fs, path::Path};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct Blog {
    date: String,
    categories: Vec<String>,
    preview: String,
}

impl Blog {
    /// Create a blog from a path
    pub fn from_path(path: &Path) -> Self {
        // date is in name (really don't like this unwrap string chain though)
        let date = path.file_stem().unwrap().to_str().unwrap().to_string();
        // and then we process data
        let data = fs::read_to_string(path).unwrap();
        let mut lines = data.lines();
        // first line is preview
        let preview = lines
            .next()
            .unwrap_or("")
            .replace("#", "")
            .trim()
            .to_string();

        // with last being the categories
        let last_line = lines.last().unwrap_or("");

        let mut categories: Vec<String> = vec![];
        if last_line.starts_with("Categories: [") {
            categories = last_line
                .replace("Categories: [", "")
                .replace("]", "")
                .split_whitespace()
                .map(|c| c.replace(",", ""))
                .collect()
        }

        Self {
            date,
            categories,
            preview,
        }
    }

    pub fn generate_rss(&self) -> Item {
        ItemBuilder::default()
            .title(self.date.to_owned())
            .link(format!(
                "https://dragmine149.github.io/Blog?blog={}",
                self.date
            ))
            .description(self.preview.to_owned())
            .categories(
                self.categories
                    .iter()
                    .map(|c| CategoryBuilder::default().name(c).build())
                    .collect::<Vec<Category>>(),
            )
            .build()

        // Uses itself to generate a rss snippet of stuff.
        // let mut rss = String::from("\t\t<item>\n");
        // rss.push_str(&format!("\t\t\t<title>{}</title>\n", self.date));
        // rss.push_str(&format!(
        //     "\t\t\t<link>https://dragmine149.github.io/Blog?blog={}</link>\n",
        //     self.date
        // ));
        // rss.push_str(&format!(
        //     "\t\t\t<description>{}</description>\n",
        //     self.preview
        // ));
        // for category in &self.categories {
        // rss.push_str(&format!("\t\t\t<category>{}</category>\n", category));
        // }
        // rss.push_str("\t\t</item>\n");

        // rss
    }

    pub fn sort_blog(&self, other: &Self) -> Ordering {
        self.date.cmp(&other.date).reverse()
    }
}

// generate a list of blogs
pub fn make_blog_list() -> Vec<Blog> {
    let paths = fs::read_dir("../Blog/Posts").unwrap(); // get all blogs
    let mut blogs: Vec<Blog> = paths
        .map(|path| path.unwrap().path()) // convert to path
        .filter(|path| path.extension().unwrap_or(OsStr::new("")) == "md") // only have markdown files
        .map(|path| Blog::from_path(&path)) // map to blog object
        .collect::<Vec<Blog>>(); // collect

    blogs.sort_by(Blog::sort_blog); // sort
    blogs // return
}

pub fn make_rss_feed(blogs: &[Blog]) {
    // let mut rss = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    // rss.push_str("<rss version=\"2.0\">\n");
    // rss.push_str("\t<channel>\n");
    // rss.push_str("\t\t<title>Dragmine149's Blog</title>\n");
    // rss.push_str("\t\t<link>https://dragmine149.github.io/Blog</link>\n");
    // rss.push_str("\t\t<description>A blog by Dragmine149</description>\n");

    // // for blog in blogs {
    // //     rss.push_str(&blog.generate_rss());
    // // }

    // rss.push_str("\t</channel>\n");
    // rss.push_str("</rss>");

    let channel = ChannelBuilder::default()
        .title("Dragmine149's Blog")
        .link("https://dragmine149.github.io/Blog")
        .description("A blog by Dragmine149")
        .items(
            blogs
                .iter()
                .map(|blog| blog.generate_rss())
                .collect::<Vec<Item>>(),
        )
        .build();

    let result = fs::write("../Blog/feed.xml", channel.to_string());

    // let result = fs::write("Blog/feed.xml", rss);
    println!("RSS feed written: {:?}", result);
}

pub fn make_json(blogs: &[Blog]) {
    // convert to json
    let json = serde_json::to_string(&blogs).unwrap();

    // save the json
    let result = fs::write("../Blog/list.json", json);
    println!("JSON file written: {:?}", result);
}
