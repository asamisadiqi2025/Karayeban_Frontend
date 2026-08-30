
import React from 'react'

// Static export needs at least one known param at build time. This page is a
// stub pending real data, so we pre-render a single placeholder route for now.
export function generateStaticParams() {
  return [{ id: "example" }]
}

const page = () => {
  return (
    <div>page</div>
  )
}

export default page