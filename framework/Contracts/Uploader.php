<?php

namespace Kirki\Ecommerce\Contracts;

interface Uploader
{
    /**
     * File upload as attachemnt and get all attachment's info with meta data
     *
     * @param array $files The array of files from the $_FILES superglobal.
     * @param int $parent_post_id
     *
     * @return array<int, array{
     *     id: int,
     *     filename: string,
     *     url: string,
     *     sizes: array<string, array{
     *         height: int,
     *         width: int,
     *         url: string,
     *         orientation: string
     *     }>,
     *     height: int,
     *     width: int,
     *     filesize: int,
     *     mime: string,
     *     type: string,
     *     thumb: array{
     *         src: string,
     *         width: int,
     *         height: int
     *     }|null,
     *     author: int,
     *     author_name: string,
     *     date: string
     * }>
     * 
     * @throws Exception
     */
    public function upload(array $files, int $parent_post_id = 0);
}
