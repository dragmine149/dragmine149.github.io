use serde::{Deserialize, Serialize};
use serde_json;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
struct Blog {
    date: String,
    categories: Vec<String>,
    preview: String,
}

fn main() {
    // assuming we're running this in the root
    let paths = fs::read_dir("Blog/Posts").unwrap();
    let mut blogs: Vec<Blog> = vec![];

    for path in paths {
        let p = path.unwrap().path();
        if p.is_dir() {
            continue;
        }
        if p.extension().unwrap() != "md" {
            // only do those of markdown files
            continue;
        }
        let date = p.file_stem().unwrap().to_str().unwrap().to_string();
        if date == "next" {
            continue;
        }

        println!("Translating: {:?}", date);

        let blog_data = fs::read_to_string(p).unwrap_or(String::new());
        let mut lines = blog_data.lines();
        let preview = lines.nth(0).unwrap().to_string().replace("#", "");
        let categories: Vec<String> = lines
            .last()
            .unwrap()
            .replace("Categories: [", "")
            .replace("]", "")
            .split_whitespace()
            .map(|c| c.to_string())
            .collect();
        println!("Categories: {:?}", categories);

        if categories.contains(&"hidden".to_string()) {
            // not meant to be include
            continue;
        }

        blogs.push(Blog {
            date,
            preview,
            categories,
        })
    }

    println!("{:?}", blogs);

    let json = serde_json::to_string(&blogs).unwrap();
    // let json = blogs.iter().fold(String::new(), |acc, b| {
    //     acc + serde_json::to_string(b).unwrap().as_str() + ","
    // });
    // .map(|b| serde_json::to_string(b).unwrap())
    // .collect::<String>();
    println!("{}", json);

    let result = fs::write("Blog/list.json", json);
    println!("{:?}", result);
}

// impl<T: fmt::Debug> fmt::Debug for Grid<T> {
//     fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
//         write!(
//             f,
//             "{}",
//             self.iter()
//                 .map(|y| {
//                     let mut yy = y.iter().fold(String::new(), |mut output, x| {
//                         // allow each cell to debug how this wish to debug.
//                         if f.alternate() {
//                             let _ = write!(output, "{:#?}", x);
//                             output
//                         } else {
//                             let _ = write!(output, "{:?}", x);
//                             output
//                         }
//                     });
//                     yy.push('\n');
//                     yy
//                 })
//                 .collect::<String>()
//         )
//     }
// }
