import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import { FiCalendar, FiUser } from 'react-icons/fi';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { useState } from 'react';
import { formatDate } from '../util/formatDate';
import { PreviewButton } from '../components/PreviewButton/index';
interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [posts, setPost] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  // Percorrer o link de proxima pagina
  // pegar todos os ports que estiver na proxima pagina
  // armazenar em newPosts os novos posts
  // Adicionar ao array de Posts, passando os posts antigos e adicionando os novos
  // e se tiver outra pagina, adicione dentro de setNextPage
  function handleLoadingMorePosts() {
    fetch(postsPagination.next_page)
      .then(res => res.json())
      .then((res: ApiSearchResponse) => {
        const newPosts = res.results.map(newPost => {
          return {
            uid: newPost.uid,
            first_publication_date: newPost.first_publication_date,
            data: {
              author: newPost.data.author,
              title: newPost.data.title,
              subtitle: newPost.data.subtitle,
            },
          };
        });
        setPost(oldPosts => [...oldPosts, ...newPosts]);
        setNextPage(res.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Inicio | Aplicacao do zero</title>
      </Head>

      <main className={`${styles.container}`}>
        <img src="/Logo.svg" alt="logo" />
        <article className={styles.content}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>
                    <FiCalendar /> {formatDate(post.first_publication_date)}
                  </time>
                  <p>
                    <FiUser /> {post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button
              type="button"
              className={styles.morePosts}
              onClick={handleLoadingMorePosts}
            >
              Carregar mais posts
            </button>
          )}
        </article>
        <PreviewButton preview={preview} />
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );

  const post = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        author: post.data.author,
        title: post.data.title,
        subtitle: post.data.subtitle,
      },
    };
  });

  return {
    props: {
      preview,
      postsPagination: {
        next_page: postsResponse.next_page,
        results: post,
      },
    },
    revalidate: 60 * 30, // 30 minutos
  };
};
