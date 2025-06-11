import { db } from "@/db"
import { categories } from "@/db/schema"

// const categoryNames = [
//   "Concepts",
//   "Positions",
//   "Guards",
//   "Sweeps",
//   "Escapes",
//   "Passes",
// ]

// const categoryPositions = [
//   "Back control",
//   "Mount control",
//   "Side control",
//   "Turtle on top",
//   "The Guard",
//   "Turtle on bottom",
//   "Side control defense",
//   "Mount defense",
//   "Back control defense"
// ]

// const categoryGuards = [
//   "Closed",
//   "Half",
//   "Deep Half",
//   "Inverted",
//   "High",
//   "Rubber",
//   "Butterfly",
//   "Single Leg X",
//   "Octopus",
//   "Donkey",
//   "Curu Curu",
//   "Shin to Shin",
//   "X",
//   "Z",
//   "Sit up",
//   "Turtle",
//   "50/50",
//   "Rat",
//   "Tornado",
//   "Spider",
//   "De La Riva",
//   "Reverse De La Riva",
//   "93",
//   "Lapel",
//   "Pancake",
//   "Williams",
//   "Worm",
// ]

const categoryNames = [
  "Cars and vehicles",
  "Comedy",
  "Education",
  "Gaming",
  "Entertainment",
  "Film and animation",
  "How-to and style",
  "Music",
  "News and politics",
  "People and blogs",
  "Pets and animals",
  "Science and technology",
  "Sports",
  "Travel and events",
]

async function main() {
  console.log("Seeding categories...")

  try {
    const values = categoryNames.map(name => ({
      name,
      description: `Videos related to ${name.toLowerCase()}`
    }))

    await db.insert(categories).values(values)

    console.log("Categories seeded successfully!")
  } catch (error) {
    console.error("Error seeding categories: ", error)
    process.exit(1)
  }
}

main()