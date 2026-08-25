import { Link } from 'react-router-dom';
export function Breadcrumbs({items}){return <nav className="breadcrumbs" aria-label="Navegação estrutural"><ol><li><Link to="/">Início</Link></li>{items.map((item,index)=><li key={item.label}>{item.to?<Link to={item.to}>{item.label}</Link>:<span aria-current={index===items.length-1?'page':undefined}>{item.label}</span>}</li>)}</ol></nav>}
