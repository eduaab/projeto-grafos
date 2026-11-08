import './ComingSoon.css'

type ComingSoonProps = {
  title: string
  description: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="coming-soon">
      <h1>
        {title} <span className="coming-soon-tag">Em breve</span>
      </h1>
      <p>{description}</p>
    </section>
  )
}
