use serde::{Deserialize, Serialize};
use std::{
    fs::{self},
    path::Path,
};

#[derive(Debug, Serialize, Deserialize)]
struct Blog {
    date: String,
    categories: Vec<String>,
    preview: String,
}

impl Blog {
    fn from_path(path: &Path) -> Self {
        let date = path.file_stem().unwrap().to_str().unwrap().to_string();
        let data = fs::read_to_string(path).unwrap();
        let mut lines = data.lines();
        let preview = lines
            .next()
            .unwrap_or("")
            .replace("#", "")
            .trim()
            .to_string();
        let categories = lines
            .last()
            .unwrap_or("")
            .replace("Categories: [", "")
            .replace("]", "")
            .split_whitespace()
            .map(|c| c.replace(",", ""))
            .collect();

        Self {
            date,
            categories,
            preview,
        }
    }

    fn generate_rss(&self) -> String {
        let mut rss = String::from("\t\t<item>\n");
        rss.push_str(&format!("\t\t\t<title>{}</title>\n", self.date));
        rss.push_str(&format!(
            "\t\t\t<link>https://dragmine149.github.io/Blog?blog={}</link>\n",
            self.date
        ));
        rss.push_str(&format!(
            "\t\t\t<description>{}</description>\n",
            self.preview
        ));
        for category in &self.categories {
            rss.push_str(&format!("\t\t\t<category>{}</category>\n", category));
        }
        rss.push_str("\t\t</item>\n");

        rss
    }
}

fn main() {
    // assuming we're running this in the root
    let paths = fs::read_dir("Blog/Posts").unwrap();
    let mut blogs: Vec<Blog> = vec![];

    for path in paths {
        let path = path.unwrap().path();
        if path.is_dir() {
            continue;
        }
        if path.extension().unwrap() != "md" {
            continue;
        }
        blogs.push(Blog::from_path(&path));
    }

    println!("{:?}", blogs);
    blogs.sort_by(|a, b| b.date.cmp(&a.date));

    // convert to json
    let json = serde_json::to_string(&blogs).unwrap();
    println!("{}", json);

    // save the json
    let result = fs::write("Blog/list.json", json);
    println!("{:?}", result);

    // make the rss feed
    let mut rss = "<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\">\n".to_string();
    rss.push_str("\t<channel>\n");
    rss.push_str("\t\t<title>Drag's Blog</title>\n");
    rss.push_str("\t\t<link>https://dragmine149.github.io/Blog</link>\n");
    rss.push_str("\t\t<description>Recently updated blog from dragmine149's blog</description>\n");

    for blog in &blogs {
        rss.push_str(&blog.generate_rss());
    }

    rss.push_str("\t</channel>\n</rss>");

    let result = fs::write("Blog/feed.xml", rss);
    println!("{:?}", result);
}
