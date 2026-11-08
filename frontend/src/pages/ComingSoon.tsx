import './ComingSoon.css'

type ComingSoonProps = {
  title: string
  description: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="coming-soon">
      <span className="coming-soon-ribbon">Em breve</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  )
}
