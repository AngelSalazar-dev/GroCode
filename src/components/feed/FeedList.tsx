"use client"

import { Post, User } from "../../generated/client"
import PostCard from "@/components/feed/PostCard"
import { motion, AnimatePresence } from "framer-motion"

export default function FeedList({ posts }: { posts: (Post & { author: User })[] }) {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <AnimatePresence>
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
